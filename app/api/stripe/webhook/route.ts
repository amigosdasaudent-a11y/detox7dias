import { NextResponse } from "next/server";
import { getStripe, planFromPriceId } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

// Stripe chama este webhook. Liberação de acesso SOMENTE aqui (nunca na página de sucesso).
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "webhook não configurado" }, { status: 500 });
  }
  const raw = await req.text();
  const stripe = getStripe();

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch {
    return NextResponse.json({ error: "assinatura inválida" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Idempotência: ignora evento já processado
  const { data: seen } = await supabase
    .from("stripe_events")
    .select("id")
    .eq("id", event.id)
    .single();
  if (seen) return NextResponse.json({ ok: true, dedup: true });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as {
        id: string;
        customer?: string;
        customer_details?: { email?: string };
        metadata?: { plan?: string };
      };
      const email =
        session.customer_details?.email?.toLowerCase().trim() || "";
      if (!email) throw new Error("checkout sem e-mail");

      // Busca preço do plano para mapear nível de acesso.
      // Preço desconhecido (ex: item de loja) NÃO libera acesso ao app.
      let plan: string | null = null;
      try {
        const full = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ["line_items.data.price"],
        });
        const priceId = full.line_items?.data?.[0]?.price?.id;
        plan = planFromPriceId(priceId);
        // Preço de plano mas com metadata explícita tem prioridade
        if (plan && session.metadata?.plan && ["essencial", "completo", "vitalicio"].includes(session.metadata.plan)) {
          plan = session.metadata.plan;
        }
      } catch {
        return NextResponse.json({ error: "checkout não encontrado" }, { status: 500 });
      }
      if (!plan) {
        await supabase.from("stripe_events").insert({ id: event.id });
        return NextResponse.json({ ok: true, skipped: "non-plan-price" });
      }

      // Cria usuário se não existir (e-mail do checkout)
      const { data: existing } = await supabase.auth.admin.listUsers();
      let userId = existing.users.find(
        (u) => u.email?.toLowerCase() === email
      )?.id;
      let isNew = false;
      if (!userId) {
        const { data: created, error } = await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
        });
        if (error) throw error;
        userId = created.user.id;
        isNew = true;
      }

      // Libera acesso (pagamento único = vitalício por padrão; ajuste expires_at se quiser prazo)
      const { error: entErr } = await supabase.from("entitlements").upsert(
        {
          user_id: userId,
          email,
          stripe_customer_id:
            typeof session.customer === "string" ? session.customer : null,
          stripe_session_id: session.id,
          plan,
          status: "active",
          expires_at: null,
        },
        { onConflict: "stripe_session_id" }
      );
      if (entErr) throw entErr;

      // Convite para definir a senha (conta nova). Sem link mágico.
      if (isNew) {
        await supabase.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/inicio`,
        });
      }
    }

    if (event.type === "invoice.paid") {
      // Fatura paga: garante acesso ativo e, nos planos 12x, agenda o fim após a 12ª
      const inv = event.data.object as {
        customer?: string;
        subscription?: string;
      };
      const customerId =
        typeof inv.customer === "string" ? inv.customer : null;
      const subId =
        typeof inv.subscription === "string" ? inv.subscription : null;
      if (customerId) {
        const { data: ent } = await supabase
          .from("entitlements")
          .select("plan")
          .eq("stripe_customer_id", customerId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (ent) {
          if (subId && (ent.plan === "completo" || ent.plan === "vitalicio")) {
            try {
              const invoices = await stripe.invoices.list({
                subscription: subId,
                limit: 100,
              });
              const paid = invoices.data.filter(
                (i) => i.status === "paid"
              ).length;
              if (paid >= 12) {
                const sub = await stripe.subscriptions.retrieve(subId);
                if (!sub.cancel_at_period_end && !sub.cancel_at) {
                  await stripe.subscriptions.update(subId, {
                    cancel_at_period_end: true,
                  });
                }
              }
            } catch {
              // mantém o acesso; tenta agendar de novo na próxima fatura
            }
          }
          await supabase
            .from("entitlements")
            .update({ status: "active", expires_at: null })
            .eq("stripe_customer_id", customerId);
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      // Assinatura encerrada: Vitalício mantém acesso para sempre; demais revogam
      const sub = event.data.object as { customer?: string };
      if (typeof sub.customer === "string") {
        const { data: ent } = await supabase
          .from("entitlements")
          .select("plan")
          .eq("stripe_customer_id", sub.customer)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (ent?.plan === "vitalicio") {
          await supabase
            .from("entitlements")
            .update({ status: "active", expires_at: null })
            .eq("stripe_customer_id", sub.customer);
        } else {
          await supabase
            .from("entitlements")
            .update({ status: "canceled" })
            .eq("stripe_customer_id", sub.customer);
        }
      }
    }

    if (
      event.type === "charge.refunded" ||
      event.type === "charge.dispute.created"
    ) {
      const charge = event.data.object as { id: string };
      // Revoga acessos ligados ao pagamento estornado (busca payment_intent via charge)
      try {
        const c = await stripe.charges.retrieve(charge.id, {
          expand: ["payment_intent"],
        });
        const pi =
          typeof c.payment_intent === "string"
            ? c.payment_intent
            : c.payment_intent?.id;
        if (pi) {
          const sessions = await stripe.checkout.sessions.list({
            payment_intent: pi,
            limit: 1,
          });
          const sid = sessions.data[0]?.id;
          if (sid) {
            await supabase
              .from("entitlements")
              .update({ status: "refunded" })
              .eq("stripe_session_id", sid);
          }
        }
      } catch {
        // log silencioso: reembolso será tratado na reconciliação
      }
    }

    await supabase.from("stripe_events").insert({ id: event.id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "falha no webhook" },
      { status: 500 }
    );
  }
}
