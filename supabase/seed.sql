-- Demo seed data for TVK Ward Tracker
-- Run AFTER schema.sql (and storage.sql if using Supabase Storage uploads)
-- Safe to re-run: clears demo profiles/events/petitions and re-inserts

-- Remove prior demo rows (keeps schema seed wards)
delete from event_invites;
delete from event_participants;
delete from events;
delete from petitions;

update wards set head_id = null, organiser_id = null;

delete from profiles;

-- Profiles (avatar paths are local demo assets served from /public/samples)
insert into profiles (id, username, address, voter_id, ward_id, role, gender, phone, is_our_vote, avatar_url)
select
  p.id,
  p.username,
  p.address,
  p.voter_id,
  w.id,
  p.role::user_role,
  p.gender::gender_type,
  p.phone,
  p.is_our_vote,
  p.avatar_url
from (values
  ('a1111111-1111-1111-1111-111111111101'::uuid, 'R. Murugan', '14, Nandhivaram Main Road', 'TN/NG/2024/001234', 1, 'ward_head', 'male', '9840123456', true, '/samples/avatars/murugan.svg'),
  ('a1111111-1111-1111-1111-111111111102'::uuid, 'K. Priya', '22, Anna Nagar Extension', 'TN/NG/2024/001235', 1, 'ward_organiser', 'female', '9840123457', true, '/samples/avatars/priya.svg'),
  ('a1111111-1111-1111-1111-111111111103'::uuid, 'S. Arun', '8, Temple Street', 'TN/NG/2024/001236', 1, 'ward_member', 'male', null, true, '/samples/avatars/arun.svg'),
  ('a1111111-1111-1111-1111-111111111104'::uuid, 'M. Lakshmi', '31, Market Lane', 'TN/NG/2024/001237', 1, 'ward_member', 'female', null, true, '/samples/avatars/lakshmi.svg'),
  ('a1111111-1111-1111-1111-111111111105'::uuid, 'V. Kumar', '5, Railway Colony', 'TN/NG/2024/001238', 1, 'ward_member', 'male', null, false, null),
  ('a1111111-1111-1111-1111-111111111106'::uuid, 'P. Selvam', '18, Bus Stand Road', 'TN/NG/2024/002101', 2, 'ward_head', 'male', null, true, '/samples/avatars/selvam.svg'),
  ('a1111111-1111-1111-1111-111111111107'::uuid, 'A. Deepa', '42, Guduvancheri High Road', 'TN/NG/2024/002102', 2, 'ward_organiser', 'female', null, true, '/samples/avatars/deepa.svg'),
  ('a1111111-1111-1111-1111-111111111108'::uuid, 'G. Ravi', '7, School Street', 'TN/NG/2024/002103', 2, 'ward_member', 'male', null, true, null),
  ('a1111111-1111-1111-1111-111111111109'::uuid, 'N. Meena', '19, Park Avenue', 'TN/NG/2024/002104', 2, 'ward_member', 'female', null, false, '/samples/avatars/mena.svg'),
  ('a1111111-1111-1111-1111-111111111110'::uuid, 'D. Karthik', '55, GST Road', 'TN/NG/2024/003001', 3, 'ward_head', 'male', null, true, '/samples/avatars/karthik.svg'),
  ('a1111111-1111-1111-1111-111111111111'::uuid, 'J. Anitha', '12, Workers Colony', 'TN/NG/2024/003002', 3, 'ward_organiser', 'female', null, true, '/samples/avatars/anitha.svg'),
  ('a1111111-1111-1111-1111-111111111112'::uuid, 'B. Suresh', '31, Factory Lane', 'TN/NG/2024/003003', 3, 'ward_member', 'male', null, true, null),
  ('a1111111-1111-1111-1111-111111111113'::uuid, 'H. Kavitha', '9, Union Office Road', 'TN/NG/2024/003004', 3, 'ward_member', 'female', null, true, '/samples/avatars/kavitha.svg'),
  ('a1111111-1111-1111-1111-111111111114'::uuid, 'T. Mohan', '44, Industrial Estate', 'TN/NG/2024/003005', 3, 'ward_member', 'male', null, false, null)
) as p(id, username, address, voter_id, ward_num, role, gender, phone, is_our_vote, avatar_url)
join wards w on w.number = p.ward_num and w.municipality_slug = 'nandhivaram_guduvancheri';

-- Ward leadership
update wards set head_id = 'a1111111-1111-1111-1111-111111111101', organiser_id = 'a1111111-1111-1111-1111-111111111102' where number = 1;
update wards set head_id = 'a1111111-1111-1111-1111-111111111106', organiser_id = 'a1111111-1111-1111-1111-111111111107' where number = 2;
update wards set head_id = 'a1111111-1111-1111-1111-111111111110', organiser_id = 'a1111111-1111-1111-1111-111111111111' where number = 3;

-- Events
insert into events (id, title_en, title_ta, description_en, description_ta, ward_id, event_date, location, status, organiser_id, photos)
select
  e.id,
  e.title_en,
  e.title_ta,
  e.description_en,
  e.description_ta,
  w.id,
  e.event_date::date,
  e.location,
  e.status::event_status,
  e.organiser_id,
  e.photos
from (values
  (
    'b2222222-2222-2222-2222-222222222201'::uuid,
    'Ward 1 Voter Awareness Rally',
    'வார்டு 1 வாக்காளர் விழிப்புணர்வு பேரணி',
    'Door-to-door awareness on voter rights along Nandhivaram Main Road.',
    'நந்திவரம் முதன்மை சாலையில் வாக்காளர் உரிமைகள் குறித்த விழிப்புணர்வு.',
    1,
    '2026-06-15',
    'Nandhivaram Main Road Ground',
    'planned',
    'a1111111-1111-1111-1111-111111111102'::uuid,
    array['/samples/events/voter-rally.svg', '/samples/events/rally-crowd.svg', '/samples/events/door-to-door.svg']
  ),
  (
    'b2222222-2222-2222-2222-222222222202'::uuid,
    'Guduvancheri Community Meeting',
    'குடுவாஞ்சேரி சமூக கூட்டம்',
    'Monthly ward review: petitions, tax issues, election preparedness.',
    'மாதாந்திர வார்டு மதிப்பாய்வு: மனுக்கள், வரி, தேர்தல் தயாரிப்பு.',
    2,
    '2026-05-28',
    'Guduvancheri Community Hall',
    'completed',
    'a1111111-1111-1111-1111-111111111107'::uuid,
    array['/samples/events/community-meeting.svg', '/samples/events/meeting-hall.svg']
  ),
  (
    'b2222222-2222-2222-2222-222222222203'::uuid,
    'GST Road Labour Rights Camp',
    'ஜிஎஸ்டி சாலை தொழிலாளர் உரிமை முகாம்',
    'Legal aid camp for factory workers near Perungalathur border.',
    'பெருங்களத்தூர் எல்லையில் தொழிலாளர்களுக்கு சட்ட உதவி முகாம்.',
    3,
    '2026-06-22',
    'Workers Colony Open Ground',
    'planned',
    'a1111111-1111-1111-1111-111111111111'::uuid,
    array['/samples/events/labour-camp.svg']
  ),
  (
    'b2222222-2222-2222-2222-222222222204'::uuid,
    'Nandhivaram Membership Drive',
    'நந்திவரம் உறுப்பினர் சேர்க்கை',
    'Weekend door-to-door membership drive in Ward 1.',
    'வார்டு 1-ல் வீடு வீடாக உறுப்பினர் சேர்க்கை.',
    1,
    '2026-06-08',
    'Ward 1 TVK Booth',
    'ongoing',
    'a1111111-1111-1111-1111-111111111101'::uuid,
    array['/samples/events/door-to-door.svg']
  )
) as e(id, title_en, title_ta, description_en, description_ta, ward_num, event_date, location, status, organiser_id, photos)
join wards w on w.number = e.ward_num and w.municipality_slug = 'nandhivaram_guduvancheri';

-- Event participants & invites
insert into event_participants (event_id, profile_id) values
  ('b2222222-2222-2222-2222-222222222201', 'a1111111-1111-1111-1111-111111111101'),
  ('b2222222-2222-2222-2222-222222222201', 'a1111111-1111-1111-1111-111111111103'),
  ('b2222222-2222-2222-2222-222222222201', 'a1111111-1111-1111-1111-111111111104'),
  ('b2222222-2222-2222-2222-222222222202', 'a1111111-1111-1111-1111-111111111106'),
  ('b2222222-2222-2222-2222-222222222202', 'a1111111-1111-1111-1111-111111111107'),
  ('b2222222-2222-2222-2222-222222222202', 'a1111111-1111-1111-1111-111111111108'),
  ('b2222222-2222-2222-2222-222222222202', 'a1111111-1111-1111-1111-111111111109'),
  ('b2222222-2222-2222-2222-222222222203', 'a1111111-1111-1111-1111-111111111110'),
  ('b2222222-2222-2222-2222-222222222203', 'a1111111-1111-1111-1111-111111111112'),
  ('b2222222-2222-2222-2222-222222222203', 'a1111111-1111-1111-1111-111111111113'),
  ('b2222222-2222-2222-2222-222222222204', 'a1111111-1111-1111-1111-111111111102'),
  ('b2222222-2222-2222-2222-222222222204', 'a1111111-1111-1111-1111-111111111103');

insert into event_invites (event_id, profile_id) values
  ('b2222222-2222-2222-2222-222222222201', 'a1111111-1111-1111-1111-111111111105'),
  ('b2222222-2222-2222-2222-222222222203', 'a1111111-1111-1111-1111-111111111114'),
  ('b2222222-2222-2222-2222-222222222204', 'a1111111-1111-1111-1111-111111111104'),
  ('b2222222-2222-2222-2222-222222222204', 'a1111111-1111-1111-1111-111111111105');

-- Petitions
insert into petitions (id, title_en, title_ta, description_en, description_ta, ward_id, petitioner_id, department, status, submitted_at, photos)
select
  p.id,
  p.title_en,
  p.title_ta,
  p.description_en,
  p.description_ta,
  w.id,
  p.petitioner_id,
  p.department::department_key,
  p.status::petition_status,
  p.submitted_at::date,
  p.photos
from (values
  (
    'c3333333-3333-3333-3333-333333333301'::uuid,
    'Street Light Repair — Nandhivaram Main Road',
    'விளக்கு பழுது — நந்திவரம் முதன்மை சாலை',
    '12 street lights non-functional for 3 months. Safety concern after 7 PM.',
    '12 விளக்குகள் 3 மாதங்களாக செயல்படவில்லை.',
    1,
    'a1111111-1111-1111-1111-111111111104'::uuid,
    'electricity_board',
    'in_progress',
    '2026-04-10',
    array['/samples/petitions/street-light.svg']
  ),
  (
    'c3333333-3333-3333-3333-333333333302'::uuid,
    'Property Tax Double Assessment',
    'சொத்து வரி இரட்டிப்பு',
    '18 households charged twice due to ward mapping error.',
    'வார்டு வரைபடப் பிழையால் 18 குடும்பங்களுக்கு இரட்டிப்பு வரி.',
    1,
    'a1111111-1111-1111-1111-111111111103'::uuid,
    'revenue_board',
    'submitted',
    '2026-05-02',
    array['/samples/petitions/property-tax.svg']
  ),
  (
    'c3333333-3333-3333-3333-333333333303'::uuid,
    'Drainage Overflow — Guduvancheri',
    'வடிகால் overflow — குடுவாஞ்சேரி',
    'Blocked drain near bus stand causing monsoon flooding.',
    'பேருந்து நிலையம் அருகில் அடைப்பு — மழை வெள்ளம்.',
    2,
    'a1111111-1111-1111-1111-111111111109'::uuid,
    'corporation',
    'resolved',
    '2026-03-15',
    array['/samples/petitions/drainage.svg']
  ),
  (
    'c3333333-3333-3333-3333-333333333304'::uuid,
    'Water Supply — Workers Colony',
    'குடிநீர் — தொழிலாளர் காலonies',
    'Irregular supply for 6 weeks. Pipeline leak near GST Road.',
    '6 வாரங்களாக ஒழுங்கற்ற குடிநீர்.',
    3,
    'a1111111-1111-1111-1111-111111111113'::uuid,
    'water_board',
    'in_progress',
    '2026-05-20',
    array['/samples/petitions/water-supply.svg']
  ),
  (
    'c3333333-3333-3333-3333-333333333305'::uuid,
    'GST Road Pothole Repair',
    'ஜிஎஸ்டி சாலை pothole பழுது',
    'Major potholes on Perungalathur border stretch.',
    'பெருங்களத்தூர் எல்லையில் பெரிய potholes.',
    3,
    'a1111111-1111-1111-1111-111111111110'::uuid,
    'corporation',
    'submitted',
    '2026-05-25',
    array['/samples/petitions/road-repair.svg']
  )
) as p(id, title_en, title_ta, description_en, description_ta, ward_num, petitioner_id, department, status, submitted_at, photos)
join wards w on w.number = p.ward_num and w.municipality_slug = 'nandhivaram_guduvancheri';
