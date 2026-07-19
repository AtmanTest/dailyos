-- ============================================================
-- agent_tasks : canal de coordination inter-agents
-- Projet : wlxtulibsipesxpwkhyz
-- ============================================================

CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "from"      TEXT NOT NULL,                          -- ex: 'hermes'
  "to"        TEXT NOT NULL,                          -- ex: 'dailyos-agent'
  task        JSONB NOT NULL,                         -- payload libre
  priority    TEXT NOT NULL DEFAULT 'medium'
              CHECK (priority IN ('low','medium','high','critical')),
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','claimed','done','blocked')),
  result      JSONB,                                  -- rempli par l'agent récepteur
  error       TEXT,                                   -- rempli si blocked
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour le polling / Realtime filter
CREATE INDEX IF NOT EXISTS idx_agent_tasks_to_status
  ON public.agent_tasks ("to", status);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_created
  ON public.agent_tasks (created_at DESC);

-- Mise à jour auto de updated_at
CREATE OR REPLACE FUNCTION update_agent_tasks_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agent_tasks_updated_at ON public.agent_tasks;
CREATE TRIGGER trg_agent_tasks_updated_at
  BEFORE UPDATE ON public.agent_tasks
  FOR EACH ROW EXECUTE FUNCTION update_agent_tasks_updated_at();

-- RLS : les agents s'authentifient via service_role ou anon selon leur setup
-- Pour l'instant on désactive RLS (les agents tournent côté serveur avec service_role)
ALTER TABLE public.agent_tasks DISABLE ROW LEVEL SECURITY;

-- Timeout claim : vue utilitaire pour repasser les tâches bloquées en pending
CREATE OR REPLACE VIEW public.agent_tasks_stale AS
  SELECT *
  FROM public.agent_tasks
  WHERE status = 'claimed'
    AND updated_at < now() - INTERVAL '10 minutes';

-- Commentaire
COMMENT ON TABLE public.agent_tasks IS
  'Canal de coordination inter-agents (Hermes ↔ DailyOS Agent). Voir AGENTS.md.';
