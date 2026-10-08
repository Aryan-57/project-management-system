import type { OpenAPIObject, SchemaObject } from '@nestjs/swagger';
const ref = (name: string) => ({ $ref: '#/components/schemas/' + name });
const text = { type: 'string' } as const;
const uuid = { type: 'string', format: 'uuid' } as const;
const time = { type: 'string', format: 'date-time' } as const;
const count = { type: 'integer', minimum: 0 } as const;
export function documentResponses(document: OpenAPIObject) {
  const schemas = document.components!.schemas!;
  schemas.User = {
    type: 'object',
    required: ['id', 'fullName', 'email', 'createdAt'],
    properties: {
      id: uuid,
      fullName: text,
      email: { type: 'string', format: 'email' },
      createdAt: time,
    },
  };
  schemas.Session = {
    type: 'object',
    required: ['user', 'expiresAt'],
    description:
      'Web: csrfToken. Mobile login/register: token. No internal session row is returned.',
    properties: { user: ref('User'), expiresAt: time, csrfToken: text, token: text },
  };
  schemas.ApiError = {
    type: 'object',
    required: ['code', 'message', 'requestId'],
    properties: {
      code: text,
      message: text,
      requestId: uuid,
      fieldErrors: { type: 'object', additionalProperties: { type: 'array', items: text } },
    },
  };
  schemas.Dashboard = {
    type: 'object',
    required: [
      'totalProjects',
      'totalTasks',
      'completedTasks',
      'pendingTasks',
      'projectsInProgress',
    ],
    properties: Object.fromEntries(
      ['totalProjects', 'totalTasks', 'completedTasks', 'pendingTasks', 'projectsInProgress'].map(
        (key) => [key, count],
      ),
    ),
  };
  schemas.Health = { type: 'object', properties: { status: { type: 'string', enum: ['ok'] } } };
  for (const name of ['Project', 'Task']) {
    const input = schemas[name + 'Input'] as SchemaObject;
    const additions: Record<string, SchemaObject> =
      name === 'Project' ? { taskCount: count, completedTaskCount: count } : { projectName: text };
    schemas[name] = {
      type: 'object',
      required: [
        ...(input.required ?? []),
        'id',
        'createdAt',
        'updatedAt',
        ...Object.keys(additions),
      ],
      properties: { ...input.properties, id: uuid, createdAt: time, updatedAt: time, ...additions },
    };
    schemas['Page' + name] = {
      type: 'object',
      required: ['items', 'total', 'page', 'pageSize'],
      properties: {
        items: { type: 'array', items: ref(name) },
        total: count,
        page: { type: 'integer', minimum: 1 },
        pageSize: { type: 'integer', minimum: 1, maximum: 100 },
      },
    };
  }
  for (const [path, item] of Object.entries(document.paths))
    for (const method of ['get', 'post', 'put', 'delete'] as const) {
      const operation = item[method];
      if (!operation) continue;
      const empty = method === 'delete' || path.endsWith('/logout');
      const code = empty ? '204' : method === 'post' && !path.endsWith('/login') ? '201' : '200';
      const resource = path.includes('/auth/')
        ? 'Session'
        : path.endsWith('/dashboard')
          ? 'Dashboard'
          : path.endsWith('/health')
            ? 'Health'
            : path.includes('/projects')
              ? method === 'get' && path.endsWith('/projects')
                ? 'PageProject'
                : 'Project'
              : method === 'get' && path.endsWith('/tasks')
                ? 'PageTask'
                : 'Task';
      operation.responses = {
        [code]: {
          description: empty ? 'Deleted/revoked successfully' : 'Success',
          ...(!empty ? { content: { 'application/json': { schema: ref(resource) } } } : {}),
        },
      };
      for (const errorCode of ['400', '401', '403', '404', '409', '413', '429', '500'])
        operation.responses[errorCode] = {
          description: 'See API error contract and route-specific validation/authentication rules.',
          content: { 'application/json': { schema: ref('ApiError') } },
        };
      for (const parameter of operation.parameters ?? [])
        if ('name' in parameter && parameter.name === 'id') parameter.schema = uuid;
    }
}
