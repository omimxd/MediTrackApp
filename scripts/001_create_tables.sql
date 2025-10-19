-- Create conditions table
create table if not exists public.conditions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- Create medications table
create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  condition_id uuid not null references public.conditions(id) on delete cascade,
  name text not null,
  dosage text not null,
  times_per_day integer not null,
  reminder_times text[] not null,
  expiry_date date not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- Create health_logs table
create table if not exists public.health_logs (
  id uuid primary key default gen_random_uuid(),
  log_date date not null,
  notes text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.conditions enable row level security;
alter table public.medications enable row level security;
alter table public.health_logs enable row level security;

-- RLS Policies for conditions
create policy "Users can view their own conditions"
  on public.conditions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own conditions"
  on public.conditions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own conditions"
  on public.conditions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own conditions"
  on public.conditions for delete
  using (auth.uid() = user_id);

-- RLS Policies for medications
create policy "Users can view their own medications"
  on public.medications for select
  using (auth.uid() = user_id);

create policy "Users can insert their own medications"
  on public.medications for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own medications"
  on public.medications for update
  using (auth.uid() = user_id);

create policy "Users can delete their own medications"
  on public.medications for delete
  using (auth.uid() = user_id);

-- RLS Policies for health_logs
create policy "Users can view their own health logs"
  on public.health_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own health logs"
  on public.health_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own health logs"
  on public.health_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete their own health logs"
  on public.health_logs for delete
  using (auth.uid() = user_id);
