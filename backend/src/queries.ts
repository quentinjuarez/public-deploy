const filters = {
  client: {
    dev: [4],
    staging: [298, 372],
    prod: [
      247, 185, 393, 367, 415, 387, 431, 491, 463, 507, 421, 527, 496, 530, 531,
      478, 450, 509, 535, 472, 140, 317, 441, 465, 490, 514, 515, 543,
    ],
  },
  demo: {
    dev: [],
    staging: [],
    prod: [
      89, 92, 159, 181, 317, 342, 343, 346, 348, 352, 355, 363, 378, 395, 400,
      406, 408, 413, 421, 444, 449, 451, 470, 474, 475, 486, 519, 537, 548, 341,
    ],
  },
  all: {
    dev: [],
    staging: [],
    prod: [],
  },
} as Record<FilterType, { [key: string]: number[] }>;

type FilterType = 'client' | 'demo' | 'all';

export const getEnrichedCompanies = (
  env: string,
  filter: FilterType = 'client'
) => {
  const filterIds = filters[filter][env];
  const whereClause =
    filterIds.length > 0
      ? `WHERE c.id = ANY(ARRAY[${filterIds.join(',')}])`
      : 'WHERE 1=1';

  return `
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
    ${whereClause}
      AND conf.id IS NOT NULL AND conf.knowledge_id != ''
      AND ( 
        SELECT COUNT(*)
        FROM company_public_config_hostnames h
        WHERE h.company_public_config_id = conf.id
      ) > 0
    GROUP BY c.id
  `;
};

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
