-- 0002: álbum (tamanho das lâminas, aviso de decisão) e marca d'água em imagem.

alter table album_spreads add column width int, add column height int;

alter table notifications drop constraint notifications_kind_check;
alter table notifications add constraint notifications_kind_check check (kind in
  ('gallery_sent','reminder','deadline_tomorrow','submitted','order_paid','album_ready','album_decided','delivered','expired'));

-- comentário no álbum só na versão que está esperando decisão: índice para achar rápido
create index if not exists album_versions_album_number on album_versions (album_id, number desc);

-- marca d'água: padrão volta a ser repetida em diagonal (protege mais que uma só no centro)
alter table photographers alter column watermark_position set default 'tiled';
update photographers set watermark_position = 'tiled' where watermark_position = 'center' and watermark_key is null;
