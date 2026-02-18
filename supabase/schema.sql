-- Profiles Table
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  role text check (role in ('candidate', 'recruiter', 'admin')),
  full_name text,
  avatar_url text,
  headline text,
  created_at timestamptz default now(),
  primary key (id)
);

-- Row Level Security (RLS) for Profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Database Trigger for Automatic Profile Creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'candidate'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Jobs Table
create table public.jobs (
  id uuid default gen_random_uuid() primary key,
  recruiter_id uuid references public.profiles(id) not null,
  title text not null,
  description text not null,
  location text not null,
  type text check (type in ('full-time', 'internship', 'contract')) not null,
  salary_range text,
  status text check (status in ('open', 'closed')) default 'open',
  created_at timestamptz default now()
);

-- RLS for Jobs
alter table public.jobs enable row level security;

create policy "Jobs are viewable by everyone."
  on jobs for select
  using ( true );

create policy "Recruiters can insert jobs."
  on jobs for insert
  with check ( 
    auth.uid() = recruiter_id 
    and exists (
      select 1 from profiles 
      where id = auth.uid() and role = 'recruiter'
    )
  );

create policy "Recruiters can update their own jobs."
  on jobs for update
  using ( auth.uid() = recruiter_id );

-- Applications Table
create table public.applications (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references public.jobs(id) not null,
  candidate_id uuid references public.profiles(id) not null,
  full_name text not null,
  email text not null,
  phone text,
  years_experience text,
  relevant_experience text,
  resume_text text,
  cover_letter text,
  status text check (status in ('pending', 'shortlisted', 'rejected')) default 'pending',
  applied_at timestamptz default now()
);

-- RLS for Applications
alter table public.applications enable row level security;

create policy "Candidates can view their own applications."
  on applications for select
  using ( auth.uid() = candidate_id );

create policy "Recruiters can view applications for their jobs."
  on applications for select
  using ( 
    exists (
      select 1 from jobs 
      where jobs.id = applications.job_id 
      and jobs.recruiter_id = auth.uid()
    )
  );

create policy "Authenticated users can submit applications."
  on applications for insert
  with check ( 
    auth.uid() = candidate_id
  );
