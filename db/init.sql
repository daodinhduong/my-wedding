create table if not exists wedding_responses (
  id bigserial primary key,
  guest_name text not null,
  wish_message text,
  attendance_status text not null default 'pending',
  guest_count integer not null default 0,
  phone text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint wedding_responses_guest_name_not_blank
    check (length(trim(guest_name)) > 0),
  constraint wedding_responses_attendance_status_valid
    check (attendance_status in ('pending', 'attending', 'not_attending')),
  constraint wedding_responses_guest_count_valid
    check (
      (attendance_status = 'attending' and guest_count between 1 and 20)
      or (attendance_status <> 'attending' and guest_count = 0)
    )
);

create index if not exists wedding_responses_created_at_idx
  on wedding_responses (created_at desc);

create index if not exists wedding_responses_attendance_status_idx
  on wedding_responses (attendance_status);
