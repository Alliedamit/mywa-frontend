CREATE OR REPLACE FUNCTION public.enforce_conversation_workspace()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  contact_ws UUID;
BEGIN
  IF NEW.contact_id IS NULL THEN RETURN NEW; END IF;
  SELECT workspace_id INTO contact_ws FROM public.contacts WHERE id = NEW.contact_id;
  IF contact_ws IS NULL THEN
    RAISE EXCEPTION 'Contact % not found', NEW.contact_id;
  END IF;
  IF contact_ws <> NEW.workspace_id THEN
    RAISE EXCEPTION 'Cross-workspace conversation: contact_ws=%, conversation_ws=%', contact_ws, NEW.workspace_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_conversations_enforce_workspace ON public.conversations;
CREATE TRIGGER trg_conversations_enforce_workspace
  BEFORE INSERT OR UPDATE OF workspace_id, contact_id ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_conversation_workspace();

CREATE OR REPLACE FUNCTION public.enforce_message_workspace()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  conv_ws UUID;
BEGIN
  SELECT workspace_id INTO conv_ws FROM public.conversations WHERE id = NEW.conversation_id;
  IF conv_ws IS NULL THEN
    RAISE EXCEPTION 'Conversation % not found', NEW.conversation_id;
  END IF;
  IF conv_ws <> NEW.workspace_id THEN
    RAISE EXCEPTION 'Cross-workspace message: conversation_ws=%, message_ws=%', conv_ws, NEW.workspace_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_messages_enforce_workspace ON public.messages;
CREATE TRIGGER trg_messages_enforce_workspace
  BEFORE INSERT OR UPDATE OF workspace_id, conversation_id ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.enforce_message_workspace();