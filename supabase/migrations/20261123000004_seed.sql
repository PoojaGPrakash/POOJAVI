-- ════════════════════════════════════════════════════════════════════
--  Initial content. Everything below is editable in the admin dashboard.
--  No products are seeded — the catalogue is created by the business.
-- ════════════════════════════════════════════════════════════════════

insert into public.categories (name, slug, description, department, display_order) values
  ('Raw Silk',         'raw-silk',         'Textured silks with a natural slub and a quiet, matte lustre.',                      'fabrics', 10),
  ('Banarasi',         'banarasi',         'Brocades woven in the Banarasi tradition, rich with zari and intricate motifs.',     'fabrics', 20),
  ('Pochampally',      'pochampally',      'Ikat weaves with the crisp geometric patterning Pochampally is known for.',          'fabrics', 30),
  ('Pure Silk',        'pure-silk',        'Silks chosen for their drape, sheen and depth of colour.',                           'fabrics', 40),
  ('Handloom Fabrics', 'handloom-fabrics', 'Fabrics woven on the handloom, carrying the character of the hand that made them.',  'fabrics', 50),
  ('Designer Fabrics', 'designer-fabrics', 'Curated statement fabrics for occasion wear and contemporary silhouettes.',          'fabrics', 60),
  ('Sarees',           'sarees',           'Sarees selected for timeless elegance — to be worn, cherished and passed on.',       'sarees',  70)
on conflict (slug) do nothing;

insert into public.site_settings (
  id,
  announcement_text,
  intro_eyebrow, intro_heading, intro_body,
  story_heading, story_body,
  craft_heading, craft_body,
  whatsapp_default_message,
  footer_about,
  privacy_policy, terms_conditions, shipping_policy, returns_policy,
  seo_title, seo_description
) values (
  1,
  'Enquire on WhatsApp for availability, pricing and personal styling assistance',
  'Poojavi The Label',
  'Textiles that carry a story',
  'Poojavi The Label is a celebration of Indian textiles — a considered edit of fabrics and sarees chosen for their craft, character and timeless elegance. Every piece is selected to be worn with intention and remembered for years to come.',
  'Wear a Story',
  E'Poojavi began with a simple belief: that what we wear can hold meaning. A length of silk can recall a celebration, a weave can echo the hands that made it, and a saree can be passed between generations.\n\nWe curate fabrics and sarees that honour India''s textile traditions while feeling right for the way you dress today. Our edit is deliberately small and personal — we would rather help you find the one piece you will treasure than offer a thousand you will forget.\n\nEvery enquiry is answered personally, so we can tell you more about a piece, share additional photographs and help you choose with confidence.',
  'Craftsmanship & Heritage',
  E'India''s weaving traditions are among the richest in the world — from brocades heavy with zari to ikats whose patterns are dyed into the yarn before a single thread is woven.\n\nWe choose each fabric for the quality of its weave, the depth of its colour and the way it drapes, and we share what we know about every piece so you understand exactly what you are choosing.',
  'Hello Poojavi The Label, I would like to know more about your collection.',
  'A label celebrating Indian textiles, craftsmanship and timeless elegance.',
  E'This Privacy Policy explains how Poojavi The Label handles the information you share with us.\n\nInformation we collect: when you send an enquiry through our contact form or message us on WhatsApp or Instagram, we receive the details you choose to share, such as your name, email address, phone number and message.\n\nHow we use it: solely to respond to your enquiry and to assist you with your purchase. We do not sell or rent your personal information.\n\nContact us at any time to ask about, correct or delete the information you have shared with us.\n\n[Please review this policy with your legal adviser before publishing.]',
  E'By using this website you agree to these terms.\n\nProduct information: we make every effort to describe and photograph our fabrics and sarees accurately. Handwoven and naturally dyed textiles can show slight variations in colour, weave and texture — these are characteristics of the craft, not defects. Colours may also appear differently on different screens.\n\nEnquiries and orders: this website does not process payments. Orders are confirmed personally through WhatsApp or email, where availability, pricing and delivery details are agreed.\n\nIntellectual property: all content on this website, including photographs and text, belongs to Poojavi The Label and may not be reproduced without permission.\n\n[Please review these terms with your legal adviser before publishing.]',
  E'Delivery timelines, charges and destinations are confirmed personally when your order is agreed over WhatsApp or email.\n\nOnce your order has been dispatched, we will share tracking details where available.\n\nFor any questions about delivery, please contact us before placing your order.\n\n[Please update this policy with your confirmed shipping details.]',
  E'All sales are final. We do not accept returns or exchanges.\n\nBecause fabrics are cut to order and every piece is carefully inspected before dispatch, we encourage you to ask for additional photographs, videos or details before confirming your order — we are always happy to help.\n\nIf your order arrives damaged, please contact us within 48 hours of delivery with photographs and an unboxing video so that we can assist you.\n\n[Please review this policy before publishing.]',
  'Poojavi The Label — Premium Indian Fabrics & Sarees',
  'Poojavi The Label is a curated house of premium Indian fabrics, sarees and ethnic fashion. Wear a Story.'
)
on conflict (id) do nothing;
