import { z } from 'zod';
import { Prisma } from '@prisma/client';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// JSON
//------------------------------------------------------

export type NullableJsonInput = Prisma.JsonValue | null | 'JsonNull' | 'DbNull' | Prisma.NullTypes.DbNull | Prisma.NullTypes.JsonNull;

export const transformJsonNull = (v?: NullableJsonInput) => {
  if (!v || v === 'DbNull') return Prisma.NullTypes.DbNull;
  if (v === 'JsonNull') return Prisma.NullTypes.JsonNull;
  return v;
};

export const JsonValueSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.literal(null),
    z.record(z.string(), z.lazy(() => JsonValueSchema.optional())),
    z.array(z.lazy(() => JsonValueSchema)),
  ])
);

export type JsonValueType = z.infer<typeof JsonValueSchema>;

export const NullableJsonValue = z
  .union([JsonValueSchema, z.literal('DbNull'), z.literal('JsonNull')])
  .nullable()
  .transform((v) => transformJsonNull(v));

export type NullableJsonValueType = z.infer<typeof NullableJsonValue>;

export const InputJsonValueSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.object({ toJSON: z.any() }),
    z.record(z.string(), z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
    z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
  ])
);

export type InputJsonValueType = z.infer<typeof InputJsonValueSchema>;


/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const UserScalarFieldEnumSchema = z.enum(['id','email','username','passwordHash','createdAt','updatedAt']);

export const RefreshTokenScalarFieldEnumSchema = z.enum(['id','tokenHash','userId','expiresAt','revokedAt','createdAt']);

export const SpotifyProfileScalarFieldEnumSchema = z.enum(['id','userId','spotifyUserId','displayName','email','avatarUrl','topArtists','topGenres','topTrackMonth','topTrackAllTime','accessTokenEnc','refreshTokenEnc','tokenExpiresAt','tokenScope','syncedAt','createdAt','updatedAt']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const JsonNullValueInputSchema: z.ZodType<Prisma.JsonNullValueInput> = z.enum(['JsonNull',]).transform((value) => (value === 'JsonNull' ? Prisma.JsonNull : value));

export const QueryModeSchema = z.enum(['default','insensitive']);

export const NullsOrderSchema = z.enum(['first','last']);

export const JsonNullValueFilterSchema: z.ZodType<Prisma.JsonNullValueFilter> = z.enum(['DbNull','JsonNull','AnyNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value === 'AnyNull' ? Prisma.AnyNull : value);
/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  username: z.string(),
  passwordHash: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type User = z.infer<typeof UserSchema>

/////////////////////////////////////////
// REFRESH TOKEN SCHEMA
/////////////////////////////////////////

export const RefreshTokenSchema = z.object({
  id: z.uuid(),
  tokenHash: z.string(),
  userId: z.string(),
  expiresAt: z.coerce.date(),
  revokedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
})

export type RefreshToken = z.infer<typeof RefreshTokenSchema>

/////////////////////////////////////////
// SPOTIFY PROFILE SCHEMA
/////////////////////////////////////////

export const SpotifyProfileSchema = z.object({
  id: z.uuid(),
  userId: z.string(),
  spotifyUserId: z.string(),
  displayName: z.string().nullable(),
  email: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  topArtists: JsonValueSchema,
  topGenres: JsonValueSchema,
  topTrackMonth: JsonValueSchema,
  topTrackAllTime: JsonValueSchema,
  /**
   * AES-GCM encrypted Spotify access token (reversible).
   */
  accessTokenEnc: z.string().nullable(),
  /**
   * AES-GCM encrypted Spotify refresh token (reversible).
   */
  refreshTokenEnc: z.string().nullable(),
  tokenExpiresAt: z.coerce.date().nullable(),
  tokenScope: z.string().nullable(),
  syncedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type SpotifyProfile = z.infer<typeof SpotifyProfileSchema>

/////////////////////////////////////////
// SELECT & INCLUDE
/////////////////////////////////////////

// USER
//------------------------------------------------------

export const UserIncludeSchema: z.ZodType<Prisma.UserInclude> = z.object({
  refreshTokens: z.union([z.boolean(),z.lazy(() => RefreshTokenFindManyArgsSchema)]).optional(),
  spotifyProfile: z.union([z.boolean(),z.lazy(() => SpotifyProfileArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const UserArgsSchema: z.ZodType<Prisma.UserDefaultArgs> = z.object({
  select: z.lazy(() => UserSelectSchema).optional(),
  include: z.lazy(() => UserIncludeSchema).optional(),
}).strict();

export const UserCountOutputTypeArgsSchema: z.ZodType<Prisma.UserCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => UserCountOutputTypeSelectSchema).nullish(),
}).strict();

export const UserCountOutputTypeSelectSchema: z.ZodType<Prisma.UserCountOutputTypeSelect> = z.object({
  refreshTokens: z.boolean().optional(),
}).strict();

export const UserSelectSchema: z.ZodType<Prisma.UserSelect> = z.object({
  id: z.boolean().optional(),
  email: z.boolean().optional(),
  username: z.boolean().optional(),
  passwordHash: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  refreshTokens: z.union([z.boolean(),z.lazy(() => RefreshTokenFindManyArgsSchema)]).optional(),
  spotifyProfile: z.union([z.boolean(),z.lazy(() => SpotifyProfileArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserCountOutputTypeArgsSchema)]).optional(),
}).strict()

// REFRESH TOKEN
//------------------------------------------------------

export const RefreshTokenIncludeSchema: z.ZodType<Prisma.RefreshTokenInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict();

export const RefreshTokenArgsSchema: z.ZodType<Prisma.RefreshTokenDefaultArgs> = z.object({
  select: z.lazy(() => RefreshTokenSelectSchema).optional(),
  include: z.lazy(() => RefreshTokenIncludeSchema).optional(),
}).strict();

export const RefreshTokenSelectSchema: z.ZodType<Prisma.RefreshTokenSelect> = z.object({
  id: z.boolean().optional(),
  tokenHash: z.boolean().optional(),
  userId: z.boolean().optional(),
  expiresAt: z.boolean().optional(),
  revokedAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

// SPOTIFY PROFILE
//------------------------------------------------------

export const SpotifyProfileIncludeSchema: z.ZodType<Prisma.SpotifyProfileInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict();

export const SpotifyProfileArgsSchema: z.ZodType<Prisma.SpotifyProfileDefaultArgs> = z.object({
  select: z.lazy(() => SpotifyProfileSelectSchema).optional(),
  include: z.lazy(() => SpotifyProfileIncludeSchema).optional(),
}).strict();

export const SpotifyProfileSelectSchema: z.ZodType<Prisma.SpotifyProfileSelect> = z.object({
  id: z.boolean().optional(),
  userId: z.boolean().optional(),
  spotifyUserId: z.boolean().optional(),
  displayName: z.boolean().optional(),
  email: z.boolean().optional(),
  avatarUrl: z.boolean().optional(),
  topArtists: z.boolean().optional(),
  topGenres: z.boolean().optional(),
  topTrackMonth: z.boolean().optional(),
  topTrackAllTime: z.boolean().optional(),
  accessTokenEnc: z.boolean().optional(),
  refreshTokenEnc: z.boolean().optional(),
  tokenExpiresAt: z.boolean().optional(),
  tokenScope: z.boolean().optional(),
  syncedAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()


/////////////////////////////////////////
// INPUT TYPES
/////////////////////////////////////////

export const UserWhereInputSchema: z.ZodType<Prisma.UserWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  email: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  username: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  passwordHash: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  refreshTokens: z.lazy(() => RefreshTokenListRelationFilterSchema).optional(),
  spotifyProfile: z.union([ z.lazy(() => SpotifyProfileNullableScalarRelationFilterSchema), z.lazy(() => SpotifyProfileWhereInputSchema) ]).optional().nullable(),
});

export const UserOrderByWithRelationInputSchema: z.ZodType<Prisma.UserOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  username: z.lazy(() => SortOrderSchema).optional(),
  passwordHash: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  refreshTokens: z.lazy(() => RefreshTokenOrderByRelationAggregateInputSchema).optional(),
  spotifyProfile: z.lazy(() => SpotifyProfileOrderByWithRelationInputSchema).optional(),
});

export const UserWhereUniqueInputSchema: z.ZodType<Prisma.UserWhereUniqueInput> = z.union([
  z.object({
    id: z.uuid(),
    email: z.string(),
    username: z.string(),
  }),
  z.object({
    id: z.uuid(),
    email: z.string(),
  }),
  z.object({
    id: z.uuid(),
    username: z.string(),
  }),
  z.object({
    id: z.uuid(),
  }),
  z.object({
    email: z.string(),
    username: z.string(),
  }),
  z.object({
    email: z.string(),
  }),
  z.object({
    username: z.string(),
  }),
])
.and(z.strictObject({
  id: z.uuid().optional(),
  email: z.string().optional(),
  username: z.string().optional(),
  AND: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  passwordHash: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  refreshTokens: z.lazy(() => RefreshTokenListRelationFilterSchema).optional(),
  spotifyProfile: z.union([ z.lazy(() => SpotifyProfileNullableScalarRelationFilterSchema), z.lazy(() => SpotifyProfileWhereInputSchema) ]).optional().nullable(),
}));

export const UserOrderByWithAggregationInputSchema: z.ZodType<Prisma.UserOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  username: z.lazy(() => SortOrderSchema).optional(),
  passwordHash: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => UserCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => UserMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => UserMinOrderByAggregateInputSchema).optional(),
});

export const UserScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.UserScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema), z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema), z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  email: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  username: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  passwordHash: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const RefreshTokenWhereInputSchema: z.ZodType<Prisma.RefreshTokenWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => RefreshTokenWhereInputSchema), z.lazy(() => RefreshTokenWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => RefreshTokenWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RefreshTokenWhereInputSchema), z.lazy(() => RefreshTokenWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  tokenHash: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  revokedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
});

export const RefreshTokenOrderByWithRelationInputSchema: z.ZodType<Prisma.RefreshTokenOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  tokenHash: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  revokedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
});

export const RefreshTokenWhereUniqueInputSchema: z.ZodType<Prisma.RefreshTokenWhereUniqueInput> = z.union([
  z.object({
    id: z.uuid(),
    tokenHash: z.string(),
  }),
  z.object({
    id: z.uuid(),
  }),
  z.object({
    tokenHash: z.string(),
  }),
])
.and(z.strictObject({
  id: z.uuid().optional(),
  tokenHash: z.string().optional(),
  AND: z.union([ z.lazy(() => RefreshTokenWhereInputSchema), z.lazy(() => RefreshTokenWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => RefreshTokenWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RefreshTokenWhereInputSchema), z.lazy(() => RefreshTokenWhereInputSchema).array() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  revokedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
}));

export const RefreshTokenOrderByWithAggregationInputSchema: z.ZodType<Prisma.RefreshTokenOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  tokenHash: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  revokedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => RefreshTokenCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => RefreshTokenMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => RefreshTokenMinOrderByAggregateInputSchema).optional(),
});

export const RefreshTokenScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.RefreshTokenScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => RefreshTokenScalarWhereWithAggregatesInputSchema), z.lazy(() => RefreshTokenScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => RefreshTokenScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RefreshTokenScalarWhereWithAggregatesInputSchema), z.lazy(() => RefreshTokenScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  tokenHash: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  revokedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const SpotifyProfileWhereInputSchema: z.ZodType<Prisma.SpotifyProfileWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => SpotifyProfileWhereInputSchema), z.lazy(() => SpotifyProfileWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SpotifyProfileWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SpotifyProfileWhereInputSchema), z.lazy(() => SpotifyProfileWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  spotifyUserId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  displayName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  email: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  avatarUrl: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  topArtists: z.lazy(() => JsonFilterSchema).optional(),
  topGenres: z.lazy(() => JsonFilterSchema).optional(),
  topTrackMonth: z.lazy(() => JsonFilterSchema).optional(),
  topTrackAllTime: z.lazy(() => JsonFilterSchema).optional(),
  accessTokenEnc: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  refreshTokenEnc: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  tokenExpiresAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  tokenScope: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  syncedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
});

export const SpotifyProfileOrderByWithRelationInputSchema: z.ZodType<Prisma.SpotifyProfileOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  spotifyUserId: z.lazy(() => SortOrderSchema).optional(),
  displayName: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  email: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  avatarUrl: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  topArtists: z.lazy(() => SortOrderSchema).optional(),
  topGenres: z.lazy(() => SortOrderSchema).optional(),
  topTrackMonth: z.lazy(() => SortOrderSchema).optional(),
  topTrackAllTime: z.lazy(() => SortOrderSchema).optional(),
  accessTokenEnc: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  refreshTokenEnc: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  tokenExpiresAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  tokenScope: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  syncedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
});

export const SpotifyProfileWhereUniqueInputSchema: z.ZodType<Prisma.SpotifyProfileWhereUniqueInput> = z.union([
  z.object({
    id: z.uuid(),
    userId: z.string(),
    spotifyUserId: z.string(),
  }),
  z.object({
    id: z.uuid(),
    userId: z.string(),
  }),
  z.object({
    id: z.uuid(),
    spotifyUserId: z.string(),
  }),
  z.object({
    id: z.uuid(),
  }),
  z.object({
    userId: z.string(),
    spotifyUserId: z.string(),
  }),
  z.object({
    userId: z.string(),
  }),
  z.object({
    spotifyUserId: z.string(),
  }),
])
.and(z.strictObject({
  id: z.uuid().optional(),
  userId: z.string().optional(),
  spotifyUserId: z.string().optional(),
  AND: z.union([ z.lazy(() => SpotifyProfileWhereInputSchema), z.lazy(() => SpotifyProfileWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SpotifyProfileWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SpotifyProfileWhereInputSchema), z.lazy(() => SpotifyProfileWhereInputSchema).array() ]).optional(),
  displayName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  email: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  avatarUrl: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  topArtists: z.lazy(() => JsonFilterSchema).optional(),
  topGenres: z.lazy(() => JsonFilterSchema).optional(),
  topTrackMonth: z.lazy(() => JsonFilterSchema).optional(),
  topTrackAllTime: z.lazy(() => JsonFilterSchema).optional(),
  accessTokenEnc: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  refreshTokenEnc: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  tokenExpiresAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  tokenScope: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  syncedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
}));

export const SpotifyProfileOrderByWithAggregationInputSchema: z.ZodType<Prisma.SpotifyProfileOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  spotifyUserId: z.lazy(() => SortOrderSchema).optional(),
  displayName: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  email: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  avatarUrl: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  topArtists: z.lazy(() => SortOrderSchema).optional(),
  topGenres: z.lazy(() => SortOrderSchema).optional(),
  topTrackMonth: z.lazy(() => SortOrderSchema).optional(),
  topTrackAllTime: z.lazy(() => SortOrderSchema).optional(),
  accessTokenEnc: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  refreshTokenEnc: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  tokenExpiresAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  tokenScope: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  syncedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => SpotifyProfileCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => SpotifyProfileMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => SpotifyProfileMinOrderByAggregateInputSchema).optional(),
});

export const SpotifyProfileScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.SpotifyProfileScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => SpotifyProfileScalarWhereWithAggregatesInputSchema), z.lazy(() => SpotifyProfileScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => SpotifyProfileScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SpotifyProfileScalarWhereWithAggregatesInputSchema), z.lazy(() => SpotifyProfileScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  spotifyUserId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  displayName: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  email: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  avatarUrl: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  topArtists: z.lazy(() => JsonWithAggregatesFilterSchema).optional(),
  topGenres: z.lazy(() => JsonWithAggregatesFilterSchema).optional(),
  topTrackMonth: z.lazy(() => JsonWithAggregatesFilterSchema).optional(),
  topTrackAllTime: z.lazy(() => JsonWithAggregatesFilterSchema).optional(),
  accessTokenEnc: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  refreshTokenEnc: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  tokenExpiresAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  tokenScope: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  syncedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const UserCreateInputSchema: z.ZodType<Prisma.UserCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  email: z.string(),
  username: z.string(),
  passwordHash: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  refreshTokens: z.lazy(() => RefreshTokenCreateNestedManyWithoutUserInputSchema).optional(),
  spotifyProfile: z.lazy(() => SpotifyProfileCreateNestedOneWithoutUserInputSchema).optional(),
});

export const UserUncheckedCreateInputSchema: z.ZodType<Prisma.UserUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  email: z.string(),
  username: z.string(),
  passwordHash: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  refreshTokens: z.lazy(() => RefreshTokenUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  spotifyProfile: z.lazy(() => SpotifyProfileUncheckedCreateNestedOneWithoutUserInputSchema).optional(),
});

export const UserUpdateInputSchema: z.ZodType<Prisma.UserUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  passwordHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  refreshTokens: z.lazy(() => RefreshTokenUpdateManyWithoutUserNestedInputSchema).optional(),
  spotifyProfile: z.lazy(() => SpotifyProfileUpdateOneWithoutUserNestedInputSchema).optional(),
});

export const UserUncheckedUpdateInputSchema: z.ZodType<Prisma.UserUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  passwordHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  refreshTokens: z.lazy(() => RefreshTokenUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  spotifyProfile: z.lazy(() => SpotifyProfileUncheckedUpdateOneWithoutUserNestedInputSchema).optional(),
});

export const UserCreateManyInputSchema: z.ZodType<Prisma.UserCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  email: z.string(),
  username: z.string(),
  passwordHash: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const UserUpdateManyMutationInputSchema: z.ZodType<Prisma.UserUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  passwordHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const UserUncheckedUpdateManyInputSchema: z.ZodType<Prisma.UserUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  passwordHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const RefreshTokenCreateInputSchema: z.ZodType<Prisma.RefreshTokenCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  tokenHash: z.string(),
  expiresAt: z.coerce.date(),
  revokedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutRefreshTokensInputSchema),
});

export const RefreshTokenUncheckedCreateInputSchema: z.ZodType<Prisma.RefreshTokenUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  tokenHash: z.string(),
  userId: z.string(),
  expiresAt: z.coerce.date(),
  revokedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
});

export const RefreshTokenUpdateInputSchema: z.ZodType<Prisma.RefreshTokenUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  tokenHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  revokedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutRefreshTokensNestedInputSchema).optional(),
});

export const RefreshTokenUncheckedUpdateInputSchema: z.ZodType<Prisma.RefreshTokenUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  tokenHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  revokedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const RefreshTokenCreateManyInputSchema: z.ZodType<Prisma.RefreshTokenCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  tokenHash: z.string(),
  userId: z.string(),
  expiresAt: z.coerce.date(),
  revokedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
});

export const RefreshTokenUpdateManyMutationInputSchema: z.ZodType<Prisma.RefreshTokenUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  tokenHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  revokedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const RefreshTokenUncheckedUpdateManyInputSchema: z.ZodType<Prisma.RefreshTokenUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  tokenHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  revokedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const SpotifyProfileCreateInputSchema: z.ZodType<Prisma.SpotifyProfileCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  spotifyUserId: z.string(),
  displayName: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  topArtists: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  topGenres: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  topTrackMonth: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  topTrackAllTime: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  accessTokenEnc: z.string().optional().nullable(),
  refreshTokenEnc: z.string().optional().nullable(),
  tokenExpiresAt: z.coerce.date().optional().nullable(),
  tokenScope: z.string().optional().nullable(),
  syncedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutSpotifyProfileInputSchema),
});

export const SpotifyProfileUncheckedCreateInputSchema: z.ZodType<Prisma.SpotifyProfileUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  userId: z.string(),
  spotifyUserId: z.string(),
  displayName: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  topArtists: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  topGenres: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  topTrackMonth: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  topTrackAllTime: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  accessTokenEnc: z.string().optional().nullable(),
  refreshTokenEnc: z.string().optional().nullable(),
  tokenExpiresAt: z.coerce.date().optional().nullable(),
  tokenScope: z.string().optional().nullable(),
  syncedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const SpotifyProfileUpdateInputSchema: z.ZodType<Prisma.SpotifyProfileUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  spotifyUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  displayName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  avatarUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  topArtists: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  topGenres: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  topTrackMonth: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  topTrackAllTime: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  accessTokenEnc: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshTokenEnc: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tokenScope: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  syncedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutSpotifyProfileNestedInputSchema).optional(),
});

export const SpotifyProfileUncheckedUpdateInputSchema: z.ZodType<Prisma.SpotifyProfileUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  spotifyUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  displayName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  avatarUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  topArtists: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  topGenres: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  topTrackMonth: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  topTrackAllTime: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  accessTokenEnc: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshTokenEnc: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tokenScope: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  syncedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const SpotifyProfileCreateManyInputSchema: z.ZodType<Prisma.SpotifyProfileCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  userId: z.string(),
  spotifyUserId: z.string(),
  displayName: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  topArtists: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  topGenres: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  topTrackMonth: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  topTrackAllTime: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  accessTokenEnc: z.string().optional().nullable(),
  refreshTokenEnc: z.string().optional().nullable(),
  tokenExpiresAt: z.coerce.date().optional().nullable(),
  tokenScope: z.string().optional().nullable(),
  syncedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const SpotifyProfileUpdateManyMutationInputSchema: z.ZodType<Prisma.SpotifyProfileUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  spotifyUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  displayName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  avatarUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  topArtists: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  topGenres: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  topTrackMonth: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  topTrackAllTime: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  accessTokenEnc: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshTokenEnc: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tokenScope: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  syncedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const SpotifyProfileUncheckedUpdateManyInputSchema: z.ZodType<Prisma.SpotifyProfileUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  spotifyUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  displayName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  avatarUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  topArtists: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  topGenres: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  topTrackMonth: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  topTrackAllTime: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  accessTokenEnc: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshTokenEnc: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tokenScope: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  syncedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const StringFilterSchema: z.ZodType<Prisma.StringFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
});

export const DateTimeFilterSchema: z.ZodType<Prisma.DateTimeFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
});

export const RefreshTokenListRelationFilterSchema: z.ZodType<Prisma.RefreshTokenListRelationFilter> = z.strictObject({
  every: z.lazy(() => RefreshTokenWhereInputSchema).optional(),
  some: z.lazy(() => RefreshTokenWhereInputSchema).optional(),
  none: z.lazy(() => RefreshTokenWhereInputSchema).optional(),
});

export const SpotifyProfileNullableScalarRelationFilterSchema: z.ZodType<Prisma.SpotifyProfileNullableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => SpotifyProfileWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => SpotifyProfileWhereInputSchema).optional().nullable(),
});

export const RefreshTokenOrderByRelationAggregateInputSchema: z.ZodType<Prisma.RefreshTokenOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const UserCountOrderByAggregateInputSchema: z.ZodType<Prisma.UserCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  username: z.lazy(() => SortOrderSchema).optional(),
  passwordHash: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const UserMaxOrderByAggregateInputSchema: z.ZodType<Prisma.UserMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  username: z.lazy(() => SortOrderSchema).optional(),
  passwordHash: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const UserMinOrderByAggregateInputSchema: z.ZodType<Prisma.UserMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  username: z.lazy(() => SortOrderSchema).optional(),
  passwordHash: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const StringWithAggregatesFilterSchema: z.ZodType<Prisma.StringWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional(),
});

export const DateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional(),
});

export const DateTimeNullableFilterSchema: z.ZodType<Prisma.DateTimeNullableFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
});

export const UserScalarRelationFilterSchema: z.ZodType<Prisma.UserScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => UserWhereInputSchema).optional(),
  isNot: z.lazy(() => UserWhereInputSchema).optional(),
});

export const SortOrderInputSchema: z.ZodType<Prisma.SortOrderInput> = z.strictObject({
  sort: z.lazy(() => SortOrderSchema),
  nulls: z.lazy(() => NullsOrderSchema).optional(),
});

export const RefreshTokenCountOrderByAggregateInputSchema: z.ZodType<Prisma.RefreshTokenCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  tokenHash: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  revokedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const RefreshTokenMaxOrderByAggregateInputSchema: z.ZodType<Prisma.RefreshTokenMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  tokenHash: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  revokedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const RefreshTokenMinOrderByAggregateInputSchema: z.ZodType<Prisma.RefreshTokenMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  tokenHash: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  revokedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const DateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
});

export const StringNullableFilterSchema: z.ZodType<Prisma.StringNullableFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
});

export const JsonFilterSchema: z.ZodType<Prisma.JsonFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
});

export const SpotifyProfileCountOrderByAggregateInputSchema: z.ZodType<Prisma.SpotifyProfileCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  spotifyUserId: z.lazy(() => SortOrderSchema).optional(),
  displayName: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  avatarUrl: z.lazy(() => SortOrderSchema).optional(),
  topArtists: z.lazy(() => SortOrderSchema).optional(),
  topGenres: z.lazy(() => SortOrderSchema).optional(),
  topTrackMonth: z.lazy(() => SortOrderSchema).optional(),
  topTrackAllTime: z.lazy(() => SortOrderSchema).optional(),
  accessTokenEnc: z.lazy(() => SortOrderSchema).optional(),
  refreshTokenEnc: z.lazy(() => SortOrderSchema).optional(),
  tokenExpiresAt: z.lazy(() => SortOrderSchema).optional(),
  tokenScope: z.lazy(() => SortOrderSchema).optional(),
  syncedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const SpotifyProfileMaxOrderByAggregateInputSchema: z.ZodType<Prisma.SpotifyProfileMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  spotifyUserId: z.lazy(() => SortOrderSchema).optional(),
  displayName: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  avatarUrl: z.lazy(() => SortOrderSchema).optional(),
  accessTokenEnc: z.lazy(() => SortOrderSchema).optional(),
  refreshTokenEnc: z.lazy(() => SortOrderSchema).optional(),
  tokenExpiresAt: z.lazy(() => SortOrderSchema).optional(),
  tokenScope: z.lazy(() => SortOrderSchema).optional(),
  syncedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const SpotifyProfileMinOrderByAggregateInputSchema: z.ZodType<Prisma.SpotifyProfileMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  spotifyUserId: z.lazy(() => SortOrderSchema).optional(),
  displayName: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  avatarUrl: z.lazy(() => SortOrderSchema).optional(),
  accessTokenEnc: z.lazy(() => SortOrderSchema).optional(),
  refreshTokenEnc: z.lazy(() => SortOrderSchema).optional(),
  tokenExpiresAt: z.lazy(() => SortOrderSchema).optional(),
  tokenScope: z.lazy(() => SortOrderSchema).optional(),
  syncedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const StringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.StringNullableWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional(),
});

export const JsonWithAggregatesFilterSchema: z.ZodType<Prisma.JsonWithAggregatesFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedJsonFilterSchema).optional(),
  _max: z.lazy(() => NestedJsonFilterSchema).optional(),
});

export const RefreshTokenCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.RefreshTokenCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => RefreshTokenCreateWithoutUserInputSchema), z.lazy(() => RefreshTokenCreateWithoutUserInputSchema).array(), z.lazy(() => RefreshTokenUncheckedCreateWithoutUserInputSchema), z.lazy(() => RefreshTokenUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RefreshTokenCreateOrConnectWithoutUserInputSchema), z.lazy(() => RefreshTokenCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RefreshTokenCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => RefreshTokenWhereUniqueInputSchema), z.lazy(() => RefreshTokenWhereUniqueInputSchema).array() ]).optional(),
});

export const SpotifyProfileCreateNestedOneWithoutUserInputSchema: z.ZodType<Prisma.SpotifyProfileCreateNestedOneWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => SpotifyProfileCreateWithoutUserInputSchema), z.lazy(() => SpotifyProfileUncheckedCreateWithoutUserInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => SpotifyProfileCreateOrConnectWithoutUserInputSchema).optional(),
  connect: z.lazy(() => SpotifyProfileWhereUniqueInputSchema).optional(),
});

export const RefreshTokenUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.RefreshTokenUncheckedCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => RefreshTokenCreateWithoutUserInputSchema), z.lazy(() => RefreshTokenCreateWithoutUserInputSchema).array(), z.lazy(() => RefreshTokenUncheckedCreateWithoutUserInputSchema), z.lazy(() => RefreshTokenUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RefreshTokenCreateOrConnectWithoutUserInputSchema), z.lazy(() => RefreshTokenCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RefreshTokenCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => RefreshTokenWhereUniqueInputSchema), z.lazy(() => RefreshTokenWhereUniqueInputSchema).array() ]).optional(),
});

export const SpotifyProfileUncheckedCreateNestedOneWithoutUserInputSchema: z.ZodType<Prisma.SpotifyProfileUncheckedCreateNestedOneWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => SpotifyProfileCreateWithoutUserInputSchema), z.lazy(() => SpotifyProfileUncheckedCreateWithoutUserInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => SpotifyProfileCreateOrConnectWithoutUserInputSchema).optional(),
  connect: z.lazy(() => SpotifyProfileWhereUniqueInputSchema).optional(),
});

export const StringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.StringFieldUpdateOperationsInput> = z.strictObject({
  set: z.string().optional(),
});

export const DateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.DateTimeFieldUpdateOperationsInput> = z.strictObject({
  set: z.coerce.date().optional(),
});

export const RefreshTokenUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.RefreshTokenUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => RefreshTokenCreateWithoutUserInputSchema), z.lazy(() => RefreshTokenCreateWithoutUserInputSchema).array(), z.lazy(() => RefreshTokenUncheckedCreateWithoutUserInputSchema), z.lazy(() => RefreshTokenUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RefreshTokenCreateOrConnectWithoutUserInputSchema), z.lazy(() => RefreshTokenCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => RefreshTokenUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => RefreshTokenUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RefreshTokenCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => RefreshTokenWhereUniqueInputSchema), z.lazy(() => RefreshTokenWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => RefreshTokenWhereUniqueInputSchema), z.lazy(() => RefreshTokenWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => RefreshTokenWhereUniqueInputSchema), z.lazy(() => RefreshTokenWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => RefreshTokenWhereUniqueInputSchema), z.lazy(() => RefreshTokenWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => RefreshTokenUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => RefreshTokenUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => RefreshTokenUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => RefreshTokenUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => RefreshTokenScalarWhereInputSchema), z.lazy(() => RefreshTokenScalarWhereInputSchema).array() ]).optional(),
});

export const SpotifyProfileUpdateOneWithoutUserNestedInputSchema: z.ZodType<Prisma.SpotifyProfileUpdateOneWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SpotifyProfileCreateWithoutUserInputSchema), z.lazy(() => SpotifyProfileUncheckedCreateWithoutUserInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => SpotifyProfileCreateOrConnectWithoutUserInputSchema).optional(),
  upsert: z.lazy(() => SpotifyProfileUpsertWithoutUserInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => SpotifyProfileWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => SpotifyProfileWhereInputSchema) ]).optional(),
  connect: z.lazy(() => SpotifyProfileWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => SpotifyProfileUpdateToOneWithWhereWithoutUserInputSchema), z.lazy(() => SpotifyProfileUpdateWithoutUserInputSchema), z.lazy(() => SpotifyProfileUncheckedUpdateWithoutUserInputSchema) ]).optional(),
});

export const RefreshTokenUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.RefreshTokenUncheckedUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => RefreshTokenCreateWithoutUserInputSchema), z.lazy(() => RefreshTokenCreateWithoutUserInputSchema).array(), z.lazy(() => RefreshTokenUncheckedCreateWithoutUserInputSchema), z.lazy(() => RefreshTokenUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RefreshTokenCreateOrConnectWithoutUserInputSchema), z.lazy(() => RefreshTokenCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => RefreshTokenUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => RefreshTokenUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RefreshTokenCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => RefreshTokenWhereUniqueInputSchema), z.lazy(() => RefreshTokenWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => RefreshTokenWhereUniqueInputSchema), z.lazy(() => RefreshTokenWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => RefreshTokenWhereUniqueInputSchema), z.lazy(() => RefreshTokenWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => RefreshTokenWhereUniqueInputSchema), z.lazy(() => RefreshTokenWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => RefreshTokenUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => RefreshTokenUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => RefreshTokenUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => RefreshTokenUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => RefreshTokenScalarWhereInputSchema), z.lazy(() => RefreshTokenScalarWhereInputSchema).array() ]).optional(),
});

export const SpotifyProfileUncheckedUpdateOneWithoutUserNestedInputSchema: z.ZodType<Prisma.SpotifyProfileUncheckedUpdateOneWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SpotifyProfileCreateWithoutUserInputSchema), z.lazy(() => SpotifyProfileUncheckedCreateWithoutUserInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => SpotifyProfileCreateOrConnectWithoutUserInputSchema).optional(),
  upsert: z.lazy(() => SpotifyProfileUpsertWithoutUserInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => SpotifyProfileWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => SpotifyProfileWhereInputSchema) ]).optional(),
  connect: z.lazy(() => SpotifyProfileWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => SpotifyProfileUpdateToOneWithWhereWithoutUserInputSchema), z.lazy(() => SpotifyProfileUpdateWithoutUserInputSchema), z.lazy(() => SpotifyProfileUncheckedUpdateWithoutUserInputSchema) ]).optional(),
});

export const UserCreateNestedOneWithoutRefreshTokensInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutRefreshTokensInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutRefreshTokensInputSchema), z.lazy(() => UserUncheckedCreateWithoutRefreshTokensInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutRefreshTokensInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
});

export const NullableDateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableDateTimeFieldUpdateOperationsInput> = z.strictObject({
  set: z.coerce.date().optional().nullable(),
});

export const UserUpdateOneRequiredWithoutRefreshTokensNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutRefreshTokensNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutRefreshTokensInputSchema), z.lazy(() => UserUncheckedCreateWithoutRefreshTokensInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutRefreshTokensInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutRefreshTokensInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutRefreshTokensInputSchema), z.lazy(() => UserUpdateWithoutRefreshTokensInputSchema), z.lazy(() => UserUncheckedUpdateWithoutRefreshTokensInputSchema) ]).optional(),
});

export const UserCreateNestedOneWithoutSpotifyProfileInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutSpotifyProfileInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutSpotifyProfileInputSchema), z.lazy(() => UserUncheckedCreateWithoutSpotifyProfileInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutSpotifyProfileInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
});

export const NullableStringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableStringFieldUpdateOperationsInput> = z.strictObject({
  set: z.string().optional().nullable(),
});

export const UserUpdateOneRequiredWithoutSpotifyProfileNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutSpotifyProfileNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutSpotifyProfileInputSchema), z.lazy(() => UserUncheckedCreateWithoutSpotifyProfileInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutSpotifyProfileInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutSpotifyProfileInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutSpotifyProfileInputSchema), z.lazy(() => UserUpdateWithoutSpotifyProfileInputSchema), z.lazy(() => UserUncheckedUpdateWithoutSpotifyProfileInputSchema) ]).optional(),
});

export const NestedStringFilterSchema: z.ZodType<Prisma.NestedStringFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
});

export const NestedDateTimeFilterSchema: z.ZodType<Prisma.NestedDateTimeFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
});

export const NestedStringWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional(),
});

export const NestedIntFilterSchema: z.ZodType<Prisma.NestedIntFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
});

export const NestedDateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional(),
});

export const NestedDateTimeNullableFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
});

export const NestedDateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
});

export const NestedIntNullableFilterSchema: z.ZodType<Prisma.NestedIntNullableFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableFilterSchema) ]).optional().nullable(),
});

export const NestedStringNullableFilterSchema: z.ZodType<Prisma.NestedStringNullableFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
});

export const NestedStringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringNullableWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional(),
});

export const NestedJsonFilterSchema: z.ZodType<Prisma.NestedJsonFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
});

export const RefreshTokenCreateWithoutUserInputSchema: z.ZodType<Prisma.RefreshTokenCreateWithoutUserInput> = z.strictObject({
  id: z.uuid().optional(),
  tokenHash: z.string(),
  expiresAt: z.coerce.date(),
  revokedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
});

export const RefreshTokenUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.RefreshTokenUncheckedCreateWithoutUserInput> = z.strictObject({
  id: z.uuid().optional(),
  tokenHash: z.string(),
  expiresAt: z.coerce.date(),
  revokedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
});

export const RefreshTokenCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.RefreshTokenCreateOrConnectWithoutUserInput> = z.strictObject({
  where: z.lazy(() => RefreshTokenWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => RefreshTokenCreateWithoutUserInputSchema), z.lazy(() => RefreshTokenUncheckedCreateWithoutUserInputSchema) ]),
});

export const RefreshTokenCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.RefreshTokenCreateManyUserInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => RefreshTokenCreateManyUserInputSchema), z.lazy(() => RefreshTokenCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const SpotifyProfileCreateWithoutUserInputSchema: z.ZodType<Prisma.SpotifyProfileCreateWithoutUserInput> = z.strictObject({
  id: z.uuid().optional(),
  spotifyUserId: z.string(),
  displayName: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  topArtists: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  topGenres: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  topTrackMonth: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  topTrackAllTime: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  accessTokenEnc: z.string().optional().nullable(),
  refreshTokenEnc: z.string().optional().nullable(),
  tokenExpiresAt: z.coerce.date().optional().nullable(),
  tokenScope: z.string().optional().nullable(),
  syncedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const SpotifyProfileUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.SpotifyProfileUncheckedCreateWithoutUserInput> = z.strictObject({
  id: z.uuid().optional(),
  spotifyUserId: z.string(),
  displayName: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  topArtists: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  topGenres: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  topTrackMonth: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  topTrackAllTime: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  accessTokenEnc: z.string().optional().nullable(),
  refreshTokenEnc: z.string().optional().nullable(),
  tokenExpiresAt: z.coerce.date().optional().nullable(),
  tokenScope: z.string().optional().nullable(),
  syncedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const SpotifyProfileCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.SpotifyProfileCreateOrConnectWithoutUserInput> = z.strictObject({
  where: z.lazy(() => SpotifyProfileWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SpotifyProfileCreateWithoutUserInputSchema), z.lazy(() => SpotifyProfileUncheckedCreateWithoutUserInputSchema) ]),
});

export const RefreshTokenUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.RefreshTokenUpsertWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => RefreshTokenWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => RefreshTokenUpdateWithoutUserInputSchema), z.lazy(() => RefreshTokenUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => RefreshTokenCreateWithoutUserInputSchema), z.lazy(() => RefreshTokenUncheckedCreateWithoutUserInputSchema) ]),
});

export const RefreshTokenUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.RefreshTokenUpdateWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => RefreshTokenWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => RefreshTokenUpdateWithoutUserInputSchema), z.lazy(() => RefreshTokenUncheckedUpdateWithoutUserInputSchema) ]),
});

export const RefreshTokenUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.RefreshTokenUpdateManyWithWhereWithoutUserInput> = z.strictObject({
  where: z.lazy(() => RefreshTokenScalarWhereInputSchema),
  data: z.union([ z.lazy(() => RefreshTokenUpdateManyMutationInputSchema), z.lazy(() => RefreshTokenUncheckedUpdateManyWithoutUserInputSchema) ]),
});

export const RefreshTokenScalarWhereInputSchema: z.ZodType<Prisma.RefreshTokenScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => RefreshTokenScalarWhereInputSchema), z.lazy(() => RefreshTokenScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => RefreshTokenScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RefreshTokenScalarWhereInputSchema), z.lazy(() => RefreshTokenScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  tokenHash: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  revokedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const SpotifyProfileUpsertWithoutUserInputSchema: z.ZodType<Prisma.SpotifyProfileUpsertWithoutUserInput> = z.strictObject({
  update: z.union([ z.lazy(() => SpotifyProfileUpdateWithoutUserInputSchema), z.lazy(() => SpotifyProfileUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => SpotifyProfileCreateWithoutUserInputSchema), z.lazy(() => SpotifyProfileUncheckedCreateWithoutUserInputSchema) ]),
  where: z.lazy(() => SpotifyProfileWhereInputSchema).optional(),
});

export const SpotifyProfileUpdateToOneWithWhereWithoutUserInputSchema: z.ZodType<Prisma.SpotifyProfileUpdateToOneWithWhereWithoutUserInput> = z.strictObject({
  where: z.lazy(() => SpotifyProfileWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => SpotifyProfileUpdateWithoutUserInputSchema), z.lazy(() => SpotifyProfileUncheckedUpdateWithoutUserInputSchema) ]),
});

export const SpotifyProfileUpdateWithoutUserInputSchema: z.ZodType<Prisma.SpotifyProfileUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  spotifyUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  displayName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  avatarUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  topArtists: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  topGenres: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  topTrackMonth: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  topTrackAllTime: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  accessTokenEnc: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshTokenEnc: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tokenScope: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  syncedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const SpotifyProfileUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.SpotifyProfileUncheckedUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  spotifyUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  displayName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  avatarUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  topArtists: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  topGenres: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  topTrackMonth: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  topTrackAllTime: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  accessTokenEnc: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshTokenEnc: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tokenScope: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  syncedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const UserCreateWithoutRefreshTokensInputSchema: z.ZodType<Prisma.UserCreateWithoutRefreshTokensInput> = z.strictObject({
  id: z.uuid().optional(),
  email: z.string(),
  username: z.string(),
  passwordHash: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  spotifyProfile: z.lazy(() => SpotifyProfileCreateNestedOneWithoutUserInputSchema).optional(),
});

export const UserUncheckedCreateWithoutRefreshTokensInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutRefreshTokensInput> = z.strictObject({
  id: z.uuid().optional(),
  email: z.string(),
  username: z.string(),
  passwordHash: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  spotifyProfile: z.lazy(() => SpotifyProfileUncheckedCreateNestedOneWithoutUserInputSchema).optional(),
});

export const UserCreateOrConnectWithoutRefreshTokensInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutRefreshTokensInput> = z.strictObject({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutRefreshTokensInputSchema), z.lazy(() => UserUncheckedCreateWithoutRefreshTokensInputSchema) ]),
});

export const UserUpsertWithoutRefreshTokensInputSchema: z.ZodType<Prisma.UserUpsertWithoutRefreshTokensInput> = z.strictObject({
  update: z.union([ z.lazy(() => UserUpdateWithoutRefreshTokensInputSchema), z.lazy(() => UserUncheckedUpdateWithoutRefreshTokensInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutRefreshTokensInputSchema), z.lazy(() => UserUncheckedCreateWithoutRefreshTokensInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional(),
});

export const UserUpdateToOneWithWhereWithoutRefreshTokensInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutRefreshTokensInput> = z.strictObject({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutRefreshTokensInputSchema), z.lazy(() => UserUncheckedUpdateWithoutRefreshTokensInputSchema) ]),
});

export const UserUpdateWithoutRefreshTokensInputSchema: z.ZodType<Prisma.UserUpdateWithoutRefreshTokensInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  passwordHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  spotifyProfile: z.lazy(() => SpotifyProfileUpdateOneWithoutUserNestedInputSchema).optional(),
});

export const UserUncheckedUpdateWithoutRefreshTokensInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutRefreshTokensInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  passwordHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  spotifyProfile: z.lazy(() => SpotifyProfileUncheckedUpdateOneWithoutUserNestedInputSchema).optional(),
});

export const UserCreateWithoutSpotifyProfileInputSchema: z.ZodType<Prisma.UserCreateWithoutSpotifyProfileInput> = z.strictObject({
  id: z.uuid().optional(),
  email: z.string(),
  username: z.string(),
  passwordHash: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  refreshTokens: z.lazy(() => RefreshTokenCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserUncheckedCreateWithoutSpotifyProfileInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutSpotifyProfileInput> = z.strictObject({
  id: z.uuid().optional(),
  email: z.string(),
  username: z.string(),
  passwordHash: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  refreshTokens: z.lazy(() => RefreshTokenUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserCreateOrConnectWithoutSpotifyProfileInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutSpotifyProfileInput> = z.strictObject({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutSpotifyProfileInputSchema), z.lazy(() => UserUncheckedCreateWithoutSpotifyProfileInputSchema) ]),
});

export const UserUpsertWithoutSpotifyProfileInputSchema: z.ZodType<Prisma.UserUpsertWithoutSpotifyProfileInput> = z.strictObject({
  update: z.union([ z.lazy(() => UserUpdateWithoutSpotifyProfileInputSchema), z.lazy(() => UserUncheckedUpdateWithoutSpotifyProfileInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutSpotifyProfileInputSchema), z.lazy(() => UserUncheckedCreateWithoutSpotifyProfileInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional(),
});

export const UserUpdateToOneWithWhereWithoutSpotifyProfileInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutSpotifyProfileInput> = z.strictObject({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutSpotifyProfileInputSchema), z.lazy(() => UserUncheckedUpdateWithoutSpotifyProfileInputSchema) ]),
});

export const UserUpdateWithoutSpotifyProfileInputSchema: z.ZodType<Prisma.UserUpdateWithoutSpotifyProfileInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  passwordHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  refreshTokens: z.lazy(() => RefreshTokenUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const UserUncheckedUpdateWithoutSpotifyProfileInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutSpotifyProfileInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  passwordHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  refreshTokens: z.lazy(() => RefreshTokenUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const RefreshTokenCreateManyUserInputSchema: z.ZodType<Prisma.RefreshTokenCreateManyUserInput> = z.strictObject({
  id: z.uuid().optional(),
  tokenHash: z.string(),
  expiresAt: z.coerce.date(),
  revokedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
});

export const RefreshTokenUpdateWithoutUserInputSchema: z.ZodType<Prisma.RefreshTokenUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  tokenHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  revokedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const RefreshTokenUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.RefreshTokenUncheckedUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  tokenHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  revokedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const RefreshTokenUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.RefreshTokenUncheckedUpdateManyWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  tokenHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  revokedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

/////////////////////////////////////////
// ARGS
/////////////////////////////////////////

export const UserFindFirstArgsSchema: z.ZodType<Prisma.UserFindFirstArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema, UserScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const UserFindFirstOrThrowArgsSchema: z.ZodType<Prisma.UserFindFirstOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema, UserScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const UserFindManyArgsSchema: z.ZodType<Prisma.UserFindManyArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema, UserScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const UserAggregateArgsSchema: z.ZodType<Prisma.UserAggregateArgs> = z.object({
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const UserGroupByArgsSchema: z.ZodType<Prisma.UserGroupByArgs> = z.object({
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithAggregationInputSchema.array(), UserOrderByWithAggregationInputSchema ]).optional(),
  by: UserScalarFieldEnumSchema.array(), 
  having: UserScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const UserFindUniqueArgsSchema: z.ZodType<Prisma.UserFindUniqueArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const UserFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.UserFindUniqueOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const RefreshTokenFindFirstArgsSchema: z.ZodType<Prisma.RefreshTokenFindFirstArgs> = z.object({
  select: RefreshTokenSelectSchema.optional(),
  include: RefreshTokenIncludeSchema.optional(),
  where: RefreshTokenWhereInputSchema.optional(), 
  orderBy: z.union([ RefreshTokenOrderByWithRelationInputSchema.array(), RefreshTokenOrderByWithRelationInputSchema ]).optional(),
  cursor: RefreshTokenWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ RefreshTokenScalarFieldEnumSchema, RefreshTokenScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const RefreshTokenFindFirstOrThrowArgsSchema: z.ZodType<Prisma.RefreshTokenFindFirstOrThrowArgs> = z.object({
  select: RefreshTokenSelectSchema.optional(),
  include: RefreshTokenIncludeSchema.optional(),
  where: RefreshTokenWhereInputSchema.optional(), 
  orderBy: z.union([ RefreshTokenOrderByWithRelationInputSchema.array(), RefreshTokenOrderByWithRelationInputSchema ]).optional(),
  cursor: RefreshTokenWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ RefreshTokenScalarFieldEnumSchema, RefreshTokenScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const RefreshTokenFindManyArgsSchema: z.ZodType<Prisma.RefreshTokenFindManyArgs> = z.object({
  select: RefreshTokenSelectSchema.optional(),
  include: RefreshTokenIncludeSchema.optional(),
  where: RefreshTokenWhereInputSchema.optional(), 
  orderBy: z.union([ RefreshTokenOrderByWithRelationInputSchema.array(), RefreshTokenOrderByWithRelationInputSchema ]).optional(),
  cursor: RefreshTokenWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ RefreshTokenScalarFieldEnumSchema, RefreshTokenScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const RefreshTokenAggregateArgsSchema: z.ZodType<Prisma.RefreshTokenAggregateArgs> = z.object({
  where: RefreshTokenWhereInputSchema.optional(), 
  orderBy: z.union([ RefreshTokenOrderByWithRelationInputSchema.array(), RefreshTokenOrderByWithRelationInputSchema ]).optional(),
  cursor: RefreshTokenWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const RefreshTokenGroupByArgsSchema: z.ZodType<Prisma.RefreshTokenGroupByArgs> = z.object({
  where: RefreshTokenWhereInputSchema.optional(), 
  orderBy: z.union([ RefreshTokenOrderByWithAggregationInputSchema.array(), RefreshTokenOrderByWithAggregationInputSchema ]).optional(),
  by: RefreshTokenScalarFieldEnumSchema.array(), 
  having: RefreshTokenScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const RefreshTokenFindUniqueArgsSchema: z.ZodType<Prisma.RefreshTokenFindUniqueArgs> = z.object({
  select: RefreshTokenSelectSchema.optional(),
  include: RefreshTokenIncludeSchema.optional(),
  where: RefreshTokenWhereUniqueInputSchema, 
}).strict();

export const RefreshTokenFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.RefreshTokenFindUniqueOrThrowArgs> = z.object({
  select: RefreshTokenSelectSchema.optional(),
  include: RefreshTokenIncludeSchema.optional(),
  where: RefreshTokenWhereUniqueInputSchema, 
}).strict();

export const SpotifyProfileFindFirstArgsSchema: z.ZodType<Prisma.SpotifyProfileFindFirstArgs> = z.object({
  select: SpotifyProfileSelectSchema.optional(),
  include: SpotifyProfileIncludeSchema.optional(),
  where: SpotifyProfileWhereInputSchema.optional(), 
  orderBy: z.union([ SpotifyProfileOrderByWithRelationInputSchema.array(), SpotifyProfileOrderByWithRelationInputSchema ]).optional(),
  cursor: SpotifyProfileWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SpotifyProfileScalarFieldEnumSchema, SpotifyProfileScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const SpotifyProfileFindFirstOrThrowArgsSchema: z.ZodType<Prisma.SpotifyProfileFindFirstOrThrowArgs> = z.object({
  select: SpotifyProfileSelectSchema.optional(),
  include: SpotifyProfileIncludeSchema.optional(),
  where: SpotifyProfileWhereInputSchema.optional(), 
  orderBy: z.union([ SpotifyProfileOrderByWithRelationInputSchema.array(), SpotifyProfileOrderByWithRelationInputSchema ]).optional(),
  cursor: SpotifyProfileWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SpotifyProfileScalarFieldEnumSchema, SpotifyProfileScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const SpotifyProfileFindManyArgsSchema: z.ZodType<Prisma.SpotifyProfileFindManyArgs> = z.object({
  select: SpotifyProfileSelectSchema.optional(),
  include: SpotifyProfileIncludeSchema.optional(),
  where: SpotifyProfileWhereInputSchema.optional(), 
  orderBy: z.union([ SpotifyProfileOrderByWithRelationInputSchema.array(), SpotifyProfileOrderByWithRelationInputSchema ]).optional(),
  cursor: SpotifyProfileWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SpotifyProfileScalarFieldEnumSchema, SpotifyProfileScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const SpotifyProfileAggregateArgsSchema: z.ZodType<Prisma.SpotifyProfileAggregateArgs> = z.object({
  where: SpotifyProfileWhereInputSchema.optional(), 
  orderBy: z.union([ SpotifyProfileOrderByWithRelationInputSchema.array(), SpotifyProfileOrderByWithRelationInputSchema ]).optional(),
  cursor: SpotifyProfileWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const SpotifyProfileGroupByArgsSchema: z.ZodType<Prisma.SpotifyProfileGroupByArgs> = z.object({
  where: SpotifyProfileWhereInputSchema.optional(), 
  orderBy: z.union([ SpotifyProfileOrderByWithAggregationInputSchema.array(), SpotifyProfileOrderByWithAggregationInputSchema ]).optional(),
  by: SpotifyProfileScalarFieldEnumSchema.array(), 
  having: SpotifyProfileScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const SpotifyProfileFindUniqueArgsSchema: z.ZodType<Prisma.SpotifyProfileFindUniqueArgs> = z.object({
  select: SpotifyProfileSelectSchema.optional(),
  include: SpotifyProfileIncludeSchema.optional(),
  where: SpotifyProfileWhereUniqueInputSchema, 
}).strict();

export const SpotifyProfileFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.SpotifyProfileFindUniqueOrThrowArgs> = z.object({
  select: SpotifyProfileSelectSchema.optional(),
  include: SpotifyProfileIncludeSchema.optional(),
  where: SpotifyProfileWhereUniqueInputSchema, 
}).strict();

export const UserCreateArgsSchema: z.ZodType<Prisma.UserCreateArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  data: z.union([ UserCreateInputSchema, UserUncheckedCreateInputSchema ]),
}).strict();

export const UserUpsertArgsSchema: z.ZodType<Prisma.UserUpsertArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
  create: z.union([ UserCreateInputSchema, UserUncheckedCreateInputSchema ]),
  update: z.union([ UserUpdateInputSchema, UserUncheckedUpdateInputSchema ]),
}).strict();

export const UserCreateManyArgsSchema: z.ZodType<Prisma.UserCreateManyArgs> = z.object({
  data: z.union([ UserCreateManyInputSchema, UserCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const UserCreateManyAndReturnArgsSchema: z.ZodType<Prisma.UserCreateManyAndReturnArgs> = z.object({
  data: z.union([ UserCreateManyInputSchema, UserCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const UserDeleteArgsSchema: z.ZodType<Prisma.UserDeleteArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const UserUpdateArgsSchema: z.ZodType<Prisma.UserUpdateArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  data: z.union([ UserUpdateInputSchema, UserUncheckedUpdateInputSchema ]),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const UserUpdateManyArgsSchema: z.ZodType<Prisma.UserUpdateManyArgs> = z.object({
  data: z.union([ UserUpdateManyMutationInputSchema, UserUncheckedUpdateManyInputSchema ]),
  where: UserWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const UserUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.UserUpdateManyAndReturnArgs> = z.object({
  data: z.union([ UserUpdateManyMutationInputSchema, UserUncheckedUpdateManyInputSchema ]),
  where: UserWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const UserDeleteManyArgsSchema: z.ZodType<Prisma.UserDeleteManyArgs> = z.object({
  where: UserWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const RefreshTokenCreateArgsSchema: z.ZodType<Prisma.RefreshTokenCreateArgs> = z.object({
  select: RefreshTokenSelectSchema.optional(),
  include: RefreshTokenIncludeSchema.optional(),
  data: z.union([ RefreshTokenCreateInputSchema, RefreshTokenUncheckedCreateInputSchema ]),
}).strict();

export const RefreshTokenUpsertArgsSchema: z.ZodType<Prisma.RefreshTokenUpsertArgs> = z.object({
  select: RefreshTokenSelectSchema.optional(),
  include: RefreshTokenIncludeSchema.optional(),
  where: RefreshTokenWhereUniqueInputSchema, 
  create: z.union([ RefreshTokenCreateInputSchema, RefreshTokenUncheckedCreateInputSchema ]),
  update: z.union([ RefreshTokenUpdateInputSchema, RefreshTokenUncheckedUpdateInputSchema ]),
}).strict();

export const RefreshTokenCreateManyArgsSchema: z.ZodType<Prisma.RefreshTokenCreateManyArgs> = z.object({
  data: z.union([ RefreshTokenCreateManyInputSchema, RefreshTokenCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const RefreshTokenCreateManyAndReturnArgsSchema: z.ZodType<Prisma.RefreshTokenCreateManyAndReturnArgs> = z.object({
  data: z.union([ RefreshTokenCreateManyInputSchema, RefreshTokenCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const RefreshTokenDeleteArgsSchema: z.ZodType<Prisma.RefreshTokenDeleteArgs> = z.object({
  select: RefreshTokenSelectSchema.optional(),
  include: RefreshTokenIncludeSchema.optional(),
  where: RefreshTokenWhereUniqueInputSchema, 
}).strict();

export const RefreshTokenUpdateArgsSchema: z.ZodType<Prisma.RefreshTokenUpdateArgs> = z.object({
  select: RefreshTokenSelectSchema.optional(),
  include: RefreshTokenIncludeSchema.optional(),
  data: z.union([ RefreshTokenUpdateInputSchema, RefreshTokenUncheckedUpdateInputSchema ]),
  where: RefreshTokenWhereUniqueInputSchema, 
}).strict();

export const RefreshTokenUpdateManyArgsSchema: z.ZodType<Prisma.RefreshTokenUpdateManyArgs> = z.object({
  data: z.union([ RefreshTokenUpdateManyMutationInputSchema, RefreshTokenUncheckedUpdateManyInputSchema ]),
  where: RefreshTokenWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const RefreshTokenUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.RefreshTokenUpdateManyAndReturnArgs> = z.object({
  data: z.union([ RefreshTokenUpdateManyMutationInputSchema, RefreshTokenUncheckedUpdateManyInputSchema ]),
  where: RefreshTokenWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const RefreshTokenDeleteManyArgsSchema: z.ZodType<Prisma.RefreshTokenDeleteManyArgs> = z.object({
  where: RefreshTokenWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const SpotifyProfileCreateArgsSchema: z.ZodType<Prisma.SpotifyProfileCreateArgs> = z.object({
  select: SpotifyProfileSelectSchema.optional(),
  include: SpotifyProfileIncludeSchema.optional(),
  data: z.union([ SpotifyProfileCreateInputSchema, SpotifyProfileUncheckedCreateInputSchema ]),
}).strict();

export const SpotifyProfileUpsertArgsSchema: z.ZodType<Prisma.SpotifyProfileUpsertArgs> = z.object({
  select: SpotifyProfileSelectSchema.optional(),
  include: SpotifyProfileIncludeSchema.optional(),
  where: SpotifyProfileWhereUniqueInputSchema, 
  create: z.union([ SpotifyProfileCreateInputSchema, SpotifyProfileUncheckedCreateInputSchema ]),
  update: z.union([ SpotifyProfileUpdateInputSchema, SpotifyProfileUncheckedUpdateInputSchema ]),
}).strict();

export const SpotifyProfileCreateManyArgsSchema: z.ZodType<Prisma.SpotifyProfileCreateManyArgs> = z.object({
  data: z.union([ SpotifyProfileCreateManyInputSchema, SpotifyProfileCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const SpotifyProfileCreateManyAndReturnArgsSchema: z.ZodType<Prisma.SpotifyProfileCreateManyAndReturnArgs> = z.object({
  data: z.union([ SpotifyProfileCreateManyInputSchema, SpotifyProfileCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const SpotifyProfileDeleteArgsSchema: z.ZodType<Prisma.SpotifyProfileDeleteArgs> = z.object({
  select: SpotifyProfileSelectSchema.optional(),
  include: SpotifyProfileIncludeSchema.optional(),
  where: SpotifyProfileWhereUniqueInputSchema, 
}).strict();

export const SpotifyProfileUpdateArgsSchema: z.ZodType<Prisma.SpotifyProfileUpdateArgs> = z.object({
  select: SpotifyProfileSelectSchema.optional(),
  include: SpotifyProfileIncludeSchema.optional(),
  data: z.union([ SpotifyProfileUpdateInputSchema, SpotifyProfileUncheckedUpdateInputSchema ]),
  where: SpotifyProfileWhereUniqueInputSchema, 
}).strict();

export const SpotifyProfileUpdateManyArgsSchema: z.ZodType<Prisma.SpotifyProfileUpdateManyArgs> = z.object({
  data: z.union([ SpotifyProfileUpdateManyMutationInputSchema, SpotifyProfileUncheckedUpdateManyInputSchema ]),
  where: SpotifyProfileWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const SpotifyProfileUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.SpotifyProfileUpdateManyAndReturnArgs> = z.object({
  data: z.union([ SpotifyProfileUpdateManyMutationInputSchema, SpotifyProfileUncheckedUpdateManyInputSchema ]),
  where: SpotifyProfileWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const SpotifyProfileDeleteManyArgsSchema: z.ZodType<Prisma.SpotifyProfileDeleteManyArgs> = z.object({
  where: SpotifyProfileWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();