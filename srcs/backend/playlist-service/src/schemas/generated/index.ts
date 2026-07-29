import { z } from 'zod';
import type { Prisma } from '@prisma/client';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////


/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const SongScalarFieldEnumSchema = z.enum(['id','isrc','fileName','spotifyTrackId','title','artist','status','failReason','source','used','createdAt','updatedAt']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const QueryModeSchema = z.enum(['default','insensitive']);

export const NullsOrderSchema = z.enum(['first','last']);

export const SongStatusSchema = z.enum(['pending','ready','failed']);

export type SongStatusType = `${z.infer<typeof SongStatusSchema>}`

/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// SONG SCHEMA
/////////////////////////////////////////

export const SongSchema = z.object({
  status: SongStatusSchema,
  id: z.uuid(),
  isrc: z.string(),
  fileName: z.string().nullable(),
  spotifyTrackId: z.string().nullable(),
  title: z.string().nullable(),
  artist: z.string().nullable(),
  failReason: z.string().nullable(),
  source: z.string(),
  used: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Song = z.infer<typeof SongSchema>

/////////////////////////////////////////
// SELECT & INCLUDE
/////////////////////////////////////////

// SONG
//------------------------------------------------------

export const SongSelectSchema: z.ZodType<Prisma.SongSelect> = z.object({
  id: z.boolean().optional(),
  isrc: z.boolean().optional(),
  fileName: z.boolean().optional(),
  spotifyTrackId: z.boolean().optional(),
  title: z.boolean().optional(),
  artist: z.boolean().optional(),
  status: z.boolean().optional(),
  failReason: z.boolean().optional(),
  source: z.boolean().optional(),
  used: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
}).strict()


/////////////////////////////////////////
// INPUT TYPES
/////////////////////////////////////////

export const SongWhereInputSchema: z.ZodType<Prisma.SongWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => SongWhereInputSchema), z.lazy(() => SongWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SongWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SongWhereInputSchema), z.lazy(() => SongWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  isrc: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  fileName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  spotifyTrackId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  title: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  artist: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  status: z.union([ z.lazy(() => EnumSongStatusFilterSchema), z.lazy(() => SongStatusSchema) ]).optional(),
  failReason: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  source: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  used: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const SongOrderByWithRelationInputSchema: z.ZodType<Prisma.SongOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  isrc: z.lazy(() => SortOrderSchema).optional(),
  fileName: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  spotifyTrackId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  title: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  artist: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  failReason: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  source: z.lazy(() => SortOrderSchema).optional(),
  used: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const SongWhereUniqueInputSchema: z.ZodType<Prisma.SongWhereUniqueInput> = z.union([
  z.object({
    id: z.uuid(),
    isrc: z.string(),
    fileName: z.string(),
  }),
  z.object({
    id: z.uuid(),
    isrc: z.string(),
  }),
  z.object({
    id: z.uuid(),
    fileName: z.string(),
  }),
  z.object({
    id: z.uuid(),
  }),
  z.object({
    isrc: z.string(),
    fileName: z.string(),
  }),
  z.object({
    isrc: z.string(),
  }),
  z.object({
    fileName: z.string(),
  }),
])
.and(z.strictObject({
  id: z.uuid().optional(),
  isrc: z.string().optional(),
  fileName: z.string().optional(),
  AND: z.union([ z.lazy(() => SongWhereInputSchema), z.lazy(() => SongWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SongWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SongWhereInputSchema), z.lazy(() => SongWhereInputSchema).array() ]).optional(),
  spotifyTrackId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  title: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  artist: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  status: z.union([ z.lazy(() => EnumSongStatusFilterSchema), z.lazy(() => SongStatusSchema) ]).optional(),
  failReason: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  source: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  used: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
}));

export const SongOrderByWithAggregationInputSchema: z.ZodType<Prisma.SongOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  isrc: z.lazy(() => SortOrderSchema).optional(),
  fileName: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  spotifyTrackId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  title: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  artist: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  failReason: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  source: z.lazy(() => SortOrderSchema).optional(),
  used: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => SongCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => SongMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => SongMinOrderByAggregateInputSchema).optional(),
});

export const SongScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.SongScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => SongScalarWhereWithAggregatesInputSchema), z.lazy(() => SongScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => SongScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SongScalarWhereWithAggregatesInputSchema), z.lazy(() => SongScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  isrc: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  fileName: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  spotifyTrackId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  title: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  artist: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  status: z.union([ z.lazy(() => EnumSongStatusWithAggregatesFilterSchema), z.lazy(() => SongStatusSchema) ]).optional(),
  failReason: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  source: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  used: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const SongCreateInputSchema: z.ZodType<Prisma.SongCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  isrc: z.string(),
  fileName: z.string().optional().nullable(),
  spotifyTrackId: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  artist: z.string().optional().nullable(),
  status: z.lazy(() => SongStatusSchema).optional(),
  failReason: z.string().optional().nullable(),
  source: z.string().optional(),
  used: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const SongUncheckedCreateInputSchema: z.ZodType<Prisma.SongUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  isrc: z.string(),
  fileName: z.string().optional().nullable(),
  spotifyTrackId: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  artist: z.string().optional().nullable(),
  status: z.lazy(() => SongStatusSchema).optional(),
  failReason: z.string().optional().nullable(),
  source: z.string().optional(),
  used: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const SongUpdateInputSchema: z.ZodType<Prisma.SongUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isrc: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  fileName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  spotifyTrackId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  title: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  artist: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => SongStatusSchema), z.lazy(() => EnumSongStatusFieldUpdateOperationsInputSchema) ]).optional(),
  failReason: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  source: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  used: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const SongUncheckedUpdateInputSchema: z.ZodType<Prisma.SongUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isrc: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  fileName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  spotifyTrackId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  title: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  artist: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => SongStatusSchema), z.lazy(() => EnumSongStatusFieldUpdateOperationsInputSchema) ]).optional(),
  failReason: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  source: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  used: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const SongCreateManyInputSchema: z.ZodType<Prisma.SongCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  isrc: z.string(),
  fileName: z.string().optional().nullable(),
  spotifyTrackId: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  artist: z.string().optional().nullable(),
  status: z.lazy(() => SongStatusSchema).optional(),
  failReason: z.string().optional().nullable(),
  source: z.string().optional(),
  used: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const SongUpdateManyMutationInputSchema: z.ZodType<Prisma.SongUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isrc: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  fileName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  spotifyTrackId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  title: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  artist: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => SongStatusSchema), z.lazy(() => EnumSongStatusFieldUpdateOperationsInputSchema) ]).optional(),
  failReason: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  source: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  used: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const SongUncheckedUpdateManyInputSchema: z.ZodType<Prisma.SongUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isrc: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  fileName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  spotifyTrackId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  title: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  artist: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => SongStatusSchema), z.lazy(() => EnumSongStatusFieldUpdateOperationsInputSchema) ]).optional(),
  failReason: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  source: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  used: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
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

export const EnumSongStatusFilterSchema: z.ZodType<Prisma.EnumSongStatusFilter> = z.strictObject({
  equals: z.lazy(() => SongStatusSchema).optional(),
  in: z.lazy(() => SongStatusSchema).array().optional(),
  notIn: z.lazy(() => SongStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => SongStatusSchema), z.lazy(() => NestedEnumSongStatusFilterSchema) ]).optional(),
});

export const BoolFilterSchema: z.ZodType<Prisma.BoolFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
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

export const SortOrderInputSchema: z.ZodType<Prisma.SortOrderInput> = z.strictObject({
  sort: z.lazy(() => SortOrderSchema),
  nulls: z.lazy(() => NullsOrderSchema).optional(),
});

export const SongCountOrderByAggregateInputSchema: z.ZodType<Prisma.SongCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  isrc: z.lazy(() => SortOrderSchema).optional(),
  fileName: z.lazy(() => SortOrderSchema).optional(),
  spotifyTrackId: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  artist: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  failReason: z.lazy(() => SortOrderSchema).optional(),
  source: z.lazy(() => SortOrderSchema).optional(),
  used: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const SongMaxOrderByAggregateInputSchema: z.ZodType<Prisma.SongMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  isrc: z.lazy(() => SortOrderSchema).optional(),
  fileName: z.lazy(() => SortOrderSchema).optional(),
  spotifyTrackId: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  artist: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  failReason: z.lazy(() => SortOrderSchema).optional(),
  source: z.lazy(() => SortOrderSchema).optional(),
  used: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const SongMinOrderByAggregateInputSchema: z.ZodType<Prisma.SongMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  isrc: z.lazy(() => SortOrderSchema).optional(),
  fileName: z.lazy(() => SortOrderSchema).optional(),
  spotifyTrackId: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  artist: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  failReason: z.lazy(() => SortOrderSchema).optional(),
  source: z.lazy(() => SortOrderSchema).optional(),
  used: z.lazy(() => SortOrderSchema).optional(),
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

export const EnumSongStatusWithAggregatesFilterSchema: z.ZodType<Prisma.EnumSongStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => SongStatusSchema).optional(),
  in: z.lazy(() => SongStatusSchema).array().optional(),
  notIn: z.lazy(() => SongStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => SongStatusSchema), z.lazy(() => NestedEnumSongStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumSongStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumSongStatusFilterSchema).optional(),
});

export const BoolWithAggregatesFilterSchema: z.ZodType<Prisma.BoolWithAggregatesFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional(),
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

export const StringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.StringFieldUpdateOperationsInput> = z.strictObject({
  set: z.string().optional(),
});

export const NullableStringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableStringFieldUpdateOperationsInput> = z.strictObject({
  set: z.string().optional().nullable(),
});

export const EnumSongStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumSongStatusFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => SongStatusSchema).optional(),
});

export const BoolFieldUpdateOperationsInputSchema: z.ZodType<Prisma.BoolFieldUpdateOperationsInput> = z.strictObject({
  set: z.boolean().optional(),
});

export const DateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.DateTimeFieldUpdateOperationsInput> = z.strictObject({
  set: z.coerce.date().optional(),
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

export const NestedEnumSongStatusFilterSchema: z.ZodType<Prisma.NestedEnumSongStatusFilter> = z.strictObject({
  equals: z.lazy(() => SongStatusSchema).optional(),
  in: z.lazy(() => SongStatusSchema).array().optional(),
  notIn: z.lazy(() => SongStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => SongStatusSchema), z.lazy(() => NestedEnumSongStatusFilterSchema) ]).optional(),
});

export const NestedBoolFilterSchema: z.ZodType<Prisma.NestedBoolFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
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

export const NestedEnumSongStatusWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumSongStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => SongStatusSchema).optional(),
  in: z.lazy(() => SongStatusSchema).array().optional(),
  notIn: z.lazy(() => SongStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => SongStatusSchema), z.lazy(() => NestedEnumSongStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumSongStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumSongStatusFilterSchema).optional(),
});

export const NestedBoolWithAggregatesFilterSchema: z.ZodType<Prisma.NestedBoolWithAggregatesFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional(),
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

/////////////////////////////////////////
// ARGS
/////////////////////////////////////////

export const SongFindFirstArgsSchema: z.ZodType<Prisma.SongFindFirstArgs> = z.object({
  select: SongSelectSchema.optional(),
  where: SongWhereInputSchema.optional(), 
  orderBy: z.union([ SongOrderByWithRelationInputSchema.array(), SongOrderByWithRelationInputSchema ]).optional(),
  cursor: SongWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SongScalarFieldEnumSchema, SongScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const SongFindFirstOrThrowArgsSchema: z.ZodType<Prisma.SongFindFirstOrThrowArgs> = z.object({
  select: SongSelectSchema.optional(),
  where: SongWhereInputSchema.optional(), 
  orderBy: z.union([ SongOrderByWithRelationInputSchema.array(), SongOrderByWithRelationInputSchema ]).optional(),
  cursor: SongWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SongScalarFieldEnumSchema, SongScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const SongFindManyArgsSchema: z.ZodType<Prisma.SongFindManyArgs> = z.object({
  select: SongSelectSchema.optional(),
  where: SongWhereInputSchema.optional(), 
  orderBy: z.union([ SongOrderByWithRelationInputSchema.array(), SongOrderByWithRelationInputSchema ]).optional(),
  cursor: SongWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SongScalarFieldEnumSchema, SongScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const SongAggregateArgsSchema: z.ZodType<Prisma.SongAggregateArgs> = z.object({
  where: SongWhereInputSchema.optional(), 
  orderBy: z.union([ SongOrderByWithRelationInputSchema.array(), SongOrderByWithRelationInputSchema ]).optional(),
  cursor: SongWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const SongGroupByArgsSchema: z.ZodType<Prisma.SongGroupByArgs> = z.object({
  where: SongWhereInputSchema.optional(), 
  orderBy: z.union([ SongOrderByWithAggregationInputSchema.array(), SongOrderByWithAggregationInputSchema ]).optional(),
  by: SongScalarFieldEnumSchema.array(), 
  having: SongScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const SongFindUniqueArgsSchema: z.ZodType<Prisma.SongFindUniqueArgs> = z.object({
  select: SongSelectSchema.optional(),
  where: SongWhereUniqueInputSchema, 
}).strict();

export const SongFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.SongFindUniqueOrThrowArgs> = z.object({
  select: SongSelectSchema.optional(),
  where: SongWhereUniqueInputSchema, 
}).strict();

export const SongCreateArgsSchema: z.ZodType<Prisma.SongCreateArgs> = z.object({
  select: SongSelectSchema.optional(),
  data: z.union([ SongCreateInputSchema, SongUncheckedCreateInputSchema ]),
}).strict();

export const SongUpsertArgsSchema: z.ZodType<Prisma.SongUpsertArgs> = z.object({
  select: SongSelectSchema.optional(),
  where: SongWhereUniqueInputSchema, 
  create: z.union([ SongCreateInputSchema, SongUncheckedCreateInputSchema ]),
  update: z.union([ SongUpdateInputSchema, SongUncheckedUpdateInputSchema ]),
}).strict();

export const SongCreateManyArgsSchema: z.ZodType<Prisma.SongCreateManyArgs> = z.object({
  data: z.union([ SongCreateManyInputSchema, SongCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const SongCreateManyAndReturnArgsSchema: z.ZodType<Prisma.SongCreateManyAndReturnArgs> = z.object({
  data: z.union([ SongCreateManyInputSchema, SongCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const SongDeleteArgsSchema: z.ZodType<Prisma.SongDeleteArgs> = z.object({
  select: SongSelectSchema.optional(),
  where: SongWhereUniqueInputSchema, 
}).strict();

export const SongUpdateArgsSchema: z.ZodType<Prisma.SongUpdateArgs> = z.object({
  select: SongSelectSchema.optional(),
  data: z.union([ SongUpdateInputSchema, SongUncheckedUpdateInputSchema ]),
  where: SongWhereUniqueInputSchema, 
}).strict();

export const SongUpdateManyArgsSchema: z.ZodType<Prisma.SongUpdateManyArgs> = z.object({
  data: z.union([ SongUpdateManyMutationInputSchema, SongUncheckedUpdateManyInputSchema ]),
  where: SongWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const SongUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.SongUpdateManyAndReturnArgs> = z.object({
  data: z.union([ SongUpdateManyMutationInputSchema, SongUncheckedUpdateManyInputSchema ]),
  where: SongWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const SongDeleteManyArgsSchema: z.ZodType<Prisma.SongDeleteManyArgs> = z.object({
  where: SongWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();