const ids = {
  dev: [4],
  staging: [298],
  prod: [
    247, 185, 393, 367, 415, 387, 431, 491, 463, 507, 421, 527, 496, 530, 531,
  ],
} as { [key: string]: number[] };

export const getEnrichedCompanies = (env: string) => `
  SELECT
    c.*,
    json_agg(
      json_build_object(
        'id', conf.id,
        'build_config', conf.build_config,
        'ui_config', conf.ui_config,
        'knowledge_id', conf.knowledge_id,
        'embedded_access_key', conf.embedded_access_key,
        'hostnames', (
          SELECT json_agg(h)
          FROM company_public_config_hostnames h
          WHERE h.company_public_config_id = conf.id
        ),
        'deployment_statuses', (
          SELECT json_agg(s ORDER BY s.updated_at DESC)
          FROM company_public_config_deployment_statuses s
          WHERE s.company_public_config_id = conf.id
        )
      )
    ) AS public_configs
  FROM companies c
  LEFT JOIN company_public_configs conf ON c.id = conf.company_id
  WHERE c.id = ANY(ARRAY[${ids[env].join(',')}])
  GROUP BY c.id
`;

export const forceReleased = (companyPublicConfigId: number) => `
    UPDATE company_public_config_deployment_statuses
    SET deployment_status = 'RELEASED', updated_at = NOW()
    WHERE company_public_config_id = ${companyPublicConfigId}
        AND updated_at = (
            SELECT MAX(updated_at)
            FROM company_public_config_deployment_statuses
            WHERE company_public_config_id = ${companyPublicConfigId}
        )
    RETURNING *;
`;

export const updateConfig = {
  text: `
    UPDATE company_public_configs
    SET build_config = $1, ui_config = $2, updated_at = NOW()
    WHERE id = $3
    RETURNING *;
  `,
  values: (
    companyPublicConfigId: number,
    build_config: any,
    ui_config: any
  ) => [
    JSON.stringify(build_config),
    JSON.stringify(ui_config),
    companyPublicConfigId,
  ],
};
