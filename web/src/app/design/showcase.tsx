"use client";
import { FolderOpen } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { CommentThread, type Comment } from "@/components/ui/CommentThread";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { GalleryCard } from "@/components/ui/GalleryCard";
import { Lightbox } from "@/components/ui/Lightbox";
import { PhotoTile } from "@/components/ui/PhotoTile";
import { PixPanel } from "@/components/ui/PixPanel";
import { SelectionCounter } from "@/components/ui/SelectionCounter";
import { StatusBadge, type GalleryStatus } from "@/components/ui/StatusBadge";
import { Switch } from "@/components/ui/Switch";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { Dropzone, UploadList } from "@/components/ui/UploadList";
import { demoPhoto } from "@/lib/demo-photos";

const swatches = [
  "bg", "surface", "surface-raised", "border", "border-input", "text", "text-muted", "accent", "on-accent",
  "selected", "favorite", "danger", "success", "warning", "info", "focus", "lightbox-bg", "on-lightbox",
];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="flex flex-col gap-4 border-t border-line py-10">
      <h2 id={`${id}-t`} className="font-display text-xl text-ink">{title}</h2>
      {children}
    </section>
  );
}

const PACKAGE = 6;

function Showcase() {
  const toast = useToast();
  const [photos, setPhotos] = useState(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: `p${i}`, src: demoPhoto(i), name: `IMG_${4100 + i}`,
      selected: i < 4, favorited: i === 1 || i === 6, comments: i === 2 ? 2 : 0, pick: i === 5,
    })),
  );
  const [open, setOpen] = useState<number | null>(null);
  const [wm, setWm] = useState(true);
  const [extras, setExtras] = useState(true);
  const [comments, setComments] = useState<Comment[]>([
    { id: "c1", author: "client", authorName: "Ana", body: "Essa é a minha preferida! Dá para tirar a placa do fundo?", at: "ontem 21:14" },
    { id: "c2", author: "photographer", authorName: "Você", body: "Dá sim, faço no tratamento.", at: "hoje 09:02" },
  ]);
  const toggle = (id: string, key: "selected" | "favorited") =>
    setPhotos((ps) => ps.map((p) => (p.id === id ? { ...p, [key]: !p[key] } : p)));
  const count = photos.filter((p) => p.selected).length;

  return (
    <main className="mx-auto max-w-content px-4 pb-24 pt-10">
      <header className="flex flex-col gap-2 pb-6">
        <p className="text-sm text-muted">replica-design · v0</p>
        <h1 className="font-display text-display text-ink">Sistema de design</h1>
        <p className="max-w-2xl text-muted">
          Neutros quentes para a foto ser o destaque. A cor de destaque é provisória (grafite):
          o <code className="font-mono text-sm">/replica-brand</code> troca os valores em
          <code className="font-mono text-sm"> replica/design/tokens.json</code>, e os nomes continuam.
        </p>
      </header>

      <Section id="cores" title="Cores (papéis)">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {swatches.map((s) => (
            <li key={s} className="overflow-hidden rounded-md border border-line bg-raised text-xs">
              <span className="block h-14 border-b border-line" style={{ background: `var(--c-${s})` }} />
              <span className="block px-2 py-1.5 font-mono text-ink">{s}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="tipo" title="Tipografia">
        <div className="flex flex-col gap-3">
          <p className="font-display text-display text-ink">Ana &amp; Pedro · 12.10</p>
          <p className="font-display text-xl text-ink">Escolha as fotos do seu álbum</p>
          <p className="text-lg font-semibold text-ink">Galerias em andamento</p>
          <p className="text-base text-ink">Texto base. Toque no círculo para selecionar uma foto; o coração guarda as favoritas.</p>
          <p className="text-sm text-muted">Texto pequeno e secundário · prazo até 20/10 às 23:59</p>
          <p className="text-xs font-medium text-muted">LEGENDA · 12 PX</p>
        </div>
      </Section>

      <Section id="botoes" title="Botões">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => toast("success", "Galeria enviada para Ana")}>Enviar galeria</Button>
          <Button variant="secondary">Copiar link</Button>
          <Button variant="ghost">Cancelar</Button>
          <Button variant="danger">Apagar galeria</Button>
          <Button loading>Enviando</Button>
          <Button disabled>Indisponível</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Pequeno</Button>
          <Button size="md">Médio</Button>
          <Button size="lg">Grande (cliente, celular)</Button>
        </div>
      </Section>

      <Section id="form" title="Formulário (nova galeria)">
        <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
          <Field label="Nome da galeria" placeholder="Casamento Ana & Pedro" />
          <Field label="Data do evento" type="date" />
          <Field label="Fotos no pacote" type="number" defaultValue={60} hint="Quantas o cliente escolhe sem pagar a mais." />
          <Field label="Preço por foto extra (R$)" type="number" defaultValue={25} error="Informe um valor maior que zero." />
          <Field label="Senha do link" placeholder="opcional" disabled hint="Desligado neste exemplo." />
        </div>
        <div className="flex max-w-md flex-col gap-4 rounded-lg border border-line bg-raised p-4">
          <Switch label="Marca d’água" description="Aplicada nas prévias antes de enviar." checked={wm} onChange={setWm} />
          <Switch label="Permitir fotos extras" description="O cliente pode passar do pacote e pagar por PIX." checked={extras} onChange={setExtras} />
          <Switch label="Comentários" checked disabled onChange={() => {}} />
        </div>
      </Section>

      <Section id="status" title="Status da galeria">
        <div className="flex flex-wrap gap-2">
          {(["draft", "sent", "in_progress", "submitted", "expired", "delivered", "archived"] as GalleryStatus[]).map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
      </Section>

      <Section id="cards" title="Cartões do gerenciador">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <GalleryCard href="#" title="Casamento Ana & Pedro" client="Ana Souza" eventDate="12/10/2026" cover={demoPhoto(0)}
            status="in_progress" photos={842} selected={38} packageSize={60} deadline="20/10 às 23:59" />
          <GalleryCard href="#" title="Pré-wedding Júlia" client="Júlia Lima" eventDate="02/10/2026" cover={demoPhoto(3)}
            status="submitted" photos={214} selected={40} packageSize={40} />
          <GalleryCard href="#" title="Batizado Theo" client="Carla Reis" eventDate="28/09/2026"
            status="expired" photos={180} selected={12} packageSize={30} deadline="venceu 10/10" />
        </div>
        <EmptyState icon={<FolderOpen className="size-8" />} title="Tudo pronto para a primeira galeria"
          body="Crie a primeira, suba as fotos do evento e mande o link para o cliente escolher."
          action={<Button>Nova galeria</Button>} />
      </Section>

      <Section id="selecao" title="Seleção do cliente (grade + contador)">
        <div className="sticky top-0 z-10 -mx-4 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur">
          <SelectionCounter count={count} packageSize={PACKAGE} extraPriceCents={2500} allowExtras={extras} />
        </div>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
          {photos.map((p, i) => (
            <li key={p.id}>
              <PhotoTile src={p.src} name={p.name} selected={p.selected} favorited={p.favorited} comments={p.comments}
                photographerPick={p.pick} onOpen={() => setOpen(i)}
                onToggleSelect={() => toggle(p.id, "selected")} onToggleFavorite={() => toggle(p.id, "favorited")} />
            </li>
          ))}
          <li><PhotoTile name="IMG_9999" src="/nao-existe.jpg" /></li>
          <li><PhotoTile name="IMG_4101" src={photos[1].src} selected favorited readOnly /></li>
        </ul>
        <p className="text-sm text-muted">Os dois últimos: foto que não carregou e galeria já enviada (só leitura). Abra uma foto: ←/→ navegam, S seleciona, F favorita.</p>
        <Lightbox
          photos={photos}
          index={open}
          onIndexChange={setOpen}
          onToggleSelect={(id) => toggle(id, "selected")}
          onToggleFavorite={(id) => toggle(id, "favorited")}
          aside={<CommentThread dark comments={open === 2 ? comments : []}
            onSend={(b) => setComments((c) => [...c, { id: String(Date.now()), author: "client", authorName: "Ana", body: b, at: "agora" }])} />}
        />
      </Section>

      <Section id="upload" title="Envio de fotos">
        <Dropzone onFiles={(f) => toast("success", `${f.length} fotos na fila`)} />
        <UploadList
          onRetry={() => toast("success", "Tentando de novo")}
          items={[
            { id: "1", name: "IMG_4100.jpg", progress: 100, status: "done" },
            { id: "2", name: "IMG_4101.jpg", progress: 64, status: "uploading" },
            { id: "3", name: "IMG_4102.jpg", progress: 0, status: "queued" },
            { id: "4", name: "IMG_4103.CR3", progress: 0, status: "error", error: "RAW não aceito" },
          ]}
        />
      </Section>

      <Section id="comentarios" title="Comentários (fundo claro)">
        <div className="max-w-md rounded-lg border border-line bg-raised p-4">
          <CommentThread comments={comments} onSend={(b) => setComments((c) => [...c, { id: String(Date.now()), author: "photographer", authorName: "Você", body: b, at: "agora" }])} />
        </div>
      </Section>

      <Section id="pix" title="Pagamento de extras (PIX)">
        <div className="grid gap-4 md:grid-cols-3">
          <PixPanel amountCents={12500} extras={5} status="pending" photographerName="Fares Rames Fotografia"
            payload="00020126580014BR.GOV.BCB.PIX0136exemplo-de-chave-aleatoria-0000000000005204000053039865406125.005802BR" />
          <PixPanel amountCents={12500} extras={5} status="paid" photographerName="Fares Rames Fotografia" payload="" />
          <PixPanel amountCents={12500} extras={5} status="expired" photographerName="Fares Rames Fotografia" payload="" />
        </div>
      </Section>
    </main>
  );
}

export function DesignShowcase() {
  return (
    <ToastProvider>
      <Showcase />
    </ToastProvider>
  );
}
