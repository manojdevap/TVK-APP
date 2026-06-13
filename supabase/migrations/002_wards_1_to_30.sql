-- Run if you already created the DB with only 3 wards — adds Ward 4 through Ward 30

insert into wards (number, name_en, name_ta, area_en, area_ta, total_voters, our_votes, male_voters, female_voters)
select
  n,
  'Ward ' || n,
  'வார்டு ' || n,
  '',
  '',
  0,
  0,
  0,
  0
from generate_series(1, 30) as n
on conflict (municipality_slug, number) do nothing;
