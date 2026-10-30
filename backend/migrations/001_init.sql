create table if not exists app_user (
    id uuid primary key,
    email varchar(320) not null unique,
    display_name varchar(120) not null,
    password_hash varchar(100) not null,
    created_at timestamptz not null default now()
);

create table if not exists habit (
    id uuid primary key,
    user_id uuid not null references app_user(id) on delete cascade,
    name varchar(120) not null,
    color varchar(7) not null default '#4A54C4',
    icon varchar(40) not null default 'check',
    created_at timestamptz not null default now(),
    archived boolean not null default false
);

create table if not exists completion (
    id uuid primary key,
    habit_id uuid not null references habit(id) on delete cascade,
    -- the user's LOCAL calendar day, sent by the client; streaks are computed on these
    done_on date not null,
    created_at timestamptz not null default now(),
    unique (habit_id, done_on)
);

create index if not exists idx_habit_user on habit(user_id);
create index if not exists idx_completion_habit on completion(habit_id);
