-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
create type subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'incomplete',
  'incomplete_expired',
  'paused'
);

create type update_event_status as enum (
  'pending',
  'approved',
  'rejected'
);

create type module_difficulty as enum (
  'easy',
  'moderate',
  'intermediate',
  'advanced',
  'expert'
);

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  full_name       text,
  role            text not null default 'user',
  avatar_url      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Also allow service role to manage profiles
create policy "profiles_service_role" on public.profiles
  using (true)
  with check (true);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- MODULES
-- ============================================================
create table public.modules (
  id                   uuid primary key default uuid_generate_v4(),
  slug                 text not null unique,
  order_index          integer not null unique,
  title                text not null,
  description          text not null,
  difficulty           module_difficulty not null,
  is_free              boolean not null default false,
  quiz_pass_threshold  numeric(4,3) not null default 0.800,
  published            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.modules enable row level security;

create policy "modules_select_published" on public.modules
  for select using (published = true);

-- ============================================================
-- LESSONS
-- ============================================================
create table public.lessons (
  id                     uuid primary key default uuid_generate_v4(),
  module_id              uuid not null references public.modules(id) on delete cascade,
  order_index            integer not null,
  title                  text not null,
  content_html           text,
  content_md             text,
  reading_time_minutes   integer,
  published              boolean not null default true,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique(module_id, order_index)
);

alter table public.lessons enable row level security;

create policy "lessons_select_published" on public.lessons
  for select using (published = true);

-- ============================================================
-- QUIZ QUESTIONS
-- ============================================================
create table public.quiz_questions (
  id              uuid primary key default uuid_generate_v4(),
  module_id       uuid not null references public.modules(id) on delete cascade,
  question_text   text not null,
  answers         jsonb not null,
  explanation     text,
  difficulty_tag  text,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.quiz_questions enable row level security;

create policy "quiz_questions_select_auth" on public.quiz_questions
  for select using (auth.role() = 'authenticated' and active = true);

-- ============================================================
-- QUIZ ATTEMPTS
-- ============================================================
create table public.quiz_attempts (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  module_id           uuid not null references public.modules(id) on delete cascade,
  questions_served    jsonb not null,
  answers_submitted   jsonb,
  score               numeric(4,3),
  passed              boolean,
  started_at          timestamptz not null default now(),
  submitted_at        timestamptz,
  time_taken_seconds  integer
);

alter table public.quiz_attempts enable row level security;

create policy "quiz_attempts_select_own" on public.quiz_attempts
  for select using (auth.uid() = user_id);

create policy "quiz_attempts_insert_own" on public.quiz_attempts
  for insert with check (auth.uid() = user_id);

create policy "quiz_attempts_update_own" on public.quiz_attempts
  for update using (auth.uid() = user_id);

create index idx_quiz_attempts_user_module
  on public.quiz_attempts(user_id, module_id);

-- ============================================================
-- USER PROGRESS
-- ============================================================
create table public.user_progress (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  module_id           uuid not null references public.modules(id) on delete cascade,
  lessons_completed   uuid[] not null default '{}',
  module_completed    boolean not null default false,
  quiz_passed         boolean not null default false,
  quiz_passed_at      timestamptz,
  last_accessed_at    timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique(user_id, module_id)
);

alter table public.user_progress enable row level security;

create policy "user_progress_select_own" on public.user_progress
  for select using (auth.uid() = user_id);

create policy "user_progress_insert_own" on public.user_progress
  for insert with check (auth.uid() = user_id);

create policy "user_progress_update_own" on public.user_progress
  for update using (auth.uid() = user_id);

create index idx_user_progress_user on public.user_progress(user_id);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create table public.subscriptions (
  id                        uuid primary key default uuid_generate_v4(),
  user_id                   uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id        text not null unique,
  stripe_subscription_id    text unique,
  stripe_price_id           text,
  status                    subscription_status not null,
  trial_start               timestamptz,
  trial_end                 timestamptz,
  current_period_start      timestamptz,
  current_period_end        timestamptz,
  cancel_at_period_end      boolean not null default false,
  canceled_at               timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique(user_id)
);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- ============================================================
-- CONTENT_UPDATES (audit log)
-- ============================================================
create table public.content_updates (
  id               uuid primary key default uuid_generate_v4(),
  lesson_id        uuid not null references public.lessons(id),
  update_event_id  uuid,
  admin_user_id    uuid references auth.users(id),
  previous_md      text not null,
  new_md           text not null,
  change_summary   text,
  applied_at       timestamptz not null default now()
);

alter table public.content_updates enable row level security;

-- ============================================================
-- UPDATE_EVENTS (daily scanner detections)
-- ============================================================
create table public.update_events (
  id                       uuid primary key default uuid_generate_v4(),
  source_url               text not null,
  source_label             text not null,
  content_hash_previous    text not null,
  content_hash_new         text not null,
  raw_content_snapshot     text,
  related_lesson_id        uuid references public.lessons(id),
  suggested_diff           text,
  status                   update_event_status not null default 'pending',
  reviewed_by              uuid references auth.users(id),
  reviewed_at              timestamptz,
  review_note              text,
  detected_at              timestamptz not null default now()
);

alter table public.update_events enable row level security;

-- ============================================================
-- HELPER: updated_at trigger function
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_updated_at_modules
  before update on public.modules
  for each row execute function public.set_updated_at();

create trigger set_updated_at_lessons
  before update on public.lessons
  for each row execute function public.set_updated_at();

create trigger set_updated_at_subscriptions
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create trigger set_updated_at_user_progress
  before update on public.user_progress
  for each row execute function public.set_updated_at();

-- ============================================================
-- HELPER: active access check
-- ============================================================
create or replace function public.user_has_active_access(p_user_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = p_user_id
      and status in ('trialing', 'active')
      and (
        (status = 'active' and (current_period_end is null or current_period_end > now()))
        or
        (status = 'trialing' and (trial_end is null or trial_end > now()))
      )
  );
$$;
