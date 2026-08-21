
DROP POLICY IF EXISTS custom_field_values_member_all ON public.custom_field_values;

CREATE POLICY custom_field_values_member_all
ON public.custom_field_values
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.custom_fields cf
    WHERE cf.id = custom_field_values.custom_field_id
      AND private.is_workspace_member(auth.uid(), cf.workspace_id)
      AND (
        (cf.module = 'contact' AND EXISTS (
          SELECT 1 FROM public.contacts c
          WHERE c.id = custom_field_values.record_id
            AND c.workspace_id = cf.workspace_id
        ))
        OR
        (cf.module = 'company' AND EXISTS (
          SELECT 1 FROM public.companies co
          WHERE co.id = custom_field_values.record_id
            AND co.workspace_id = cf.workspace_id
        ))
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.custom_fields cf
    WHERE cf.id = custom_field_values.custom_field_id
      AND private.is_workspace_member(auth.uid(), cf.workspace_id)
      AND (
        (cf.module = 'contact' AND EXISTS (
          SELECT 1 FROM public.contacts c
          WHERE c.id = custom_field_values.record_id
            AND c.workspace_id = cf.workspace_id
        ))
        OR
        (cf.module = 'company' AND EXISTS (
          SELECT 1 FROM public.companies co
          WHERE co.id = custom_field_values.record_id
            AND co.workspace_id = cf.workspace_id
        ))
      )
  )
);
