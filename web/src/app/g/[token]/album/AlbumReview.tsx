"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SpreadView, type SpreadComment } from "@/components/ui/SpreadView";
import { useToast } from "@/components/ui/Toast";

type Spread = { id: string; position: number; src: string; comments: SpreadComment[] };

export function AlbumReview({ token, versionId, number, locked, spreads: initial }: {
  token: string; versionId: string; number: number; locked: boolean; spreads: Spread[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [spreads, setSpreads] = useState(initial);
  const [busy, setBusy] = useState<"approved" | "changes_requested" | null>(null);
  const [confirming, setConfirming] = useState(false);
  const total = spreads.reduce((n, s) => n + s.comments.length, 0);

  async function add(spreadId: string, x: number | null, y: number | null, body: string) {
    const r = await fetch(`/api/g/${token}/album/comments`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ spreadId, x, y, body }),
    }).catch(() => null);
    const json = r ? await r.json().catch(() => ({})) : {};
    if (!r?.ok) { toast("error", json.message ?? "Sem conexão. O comentário não foi salvo."); return false; }
    setSpreads((xs) => xs.map((s) => (s.id === spreadId ? { ...s, comments: [...s.comments, { id: json.id, x, y, body: json.body, author: "client" }] } : s)));
    return true;
  }

  async function decide(decision: "approved" | "changes_requested") {
    setBusy(decision);
    const r = await fetch(`/api/g/${token}/album/decision`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ versionId, decision }),
    }).catch(() => null);
    setBusy(null);
    setConfirming(false);
    if (!r?.ok) return toast("error", ((await r?.json().catch(() => ({}))) as { message?: string })?.message ?? "Não deu para enviar agora.");
    toast("success", decision === "approved" ? "Álbum aprovado. Obrigado!" : "Pedido de ajustes enviado ao fotógrafo.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <ul className="flex flex-col gap-10">
        {spreads.map((s) => (
          <li key={s.id}>
            <SpreadView src={s.src} label={`Página ${s.position}`} comments={s.comments} editable={!locked}
              onAdd={(x, y, body) => add(s.id, x, y, body)} />
          </li>
        ))}
      </ul>
      {!locked && (
        <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">{total ? `${total} ${total === 1 ? "comentário" : "comentários"} nesta versão.` : "Nenhum comentário ainda."}</p>
          {confirming ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-ink">Aprovar a versão {number}? Depois disso ela vai para impressão.</span>
              <Button loading={busy === "approved"} onClick={() => decide("approved")}>Sim, aprovar</Button>
              <Button variant="ghost" onClick={() => setConfirming(false)}>Voltar</Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" loading={busy === "changes_requested"} disabled={total === 0}
                onClick={() => decide("changes_requested")}>Pedir ajustes</Button>
              <Button onClick={() => setConfirming(true)}>Aprovar álbum</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
