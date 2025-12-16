This package contains the official TypeScript query builder for TaylorDB. It provides a type-safe and intuitive API for building and executing queries against your TaylorDB database.

## Available Query Builder Methods

**IMPORTANT FOR AI AGENTS**: The following is a complete list of available methods. Do not assume methods exist that are not listed here.

### Query Types (Starting Methods)

- `selectFrom(tableName)` - Start a SELECT query
- `insertInto(tableName)` - Start an INSERT query
- `update(tableName)` - Start an UPDATE query
- `deleteFrom(tableName)` - Start a DELETE query
- `aggregateFrom(tableName)` - Start an aggregation query
- `batch(queries)` - Execute multiple queries in parallel
- `transaction(callback)` - Execute queries in a transaction

### Query Chain Methods

**For SELECT queries (`selectFrom`):**
- `.select(fields)` - Specify fields to select (array of field names)
- `.selectAll()` - Select all fields
- `.where(field, operator, value)` - Add a WHERE condition
- `.orderBy(field, direction)` - Sort results ('asc' or 'desc')
- `.paginate(page, pageSize)` - Paginate results
- `.with(relations)` - Include related records
- `.count()` - **Count records matching the query** (returns `Promise<number>` directly)
- `.execute()` - Execute query and return array of results
- `.executeTakeFirst()` - Execute query and return first result or undefined

**For INSERT queries (`insertInto`):**
- `.values(data)` - Set values to insert
- `.execute()` - Execute insert and return array of inserted records
- `.executeTakeFirst()` - Execute insert and return first inserted record

**For UPDATE queries (`update`):**
- `.set(data)` - Set values to update
- `.where(field, operator, value)` - Add a WHERE condition
- `.execute()` - Execute update and return `{ affectedRecords: number }`

**For DELETE queries (`deleteFrom`):**
- `.where(field, operator, value)` - Add a WHERE condition
- `.execute()` - Execute delete and return `{ affectedRecords: number }`

**For AGGREGATION queries (`aggregateFrom`):**
- `.groupBy(field, direction)` - Group by a field ('asc' or 'desc')
- `.metrics(aggregateFunctions)` - Specify aggregate functions (e.g., `{ total: count('id') }`)
- `.where(field, operator, value)` - Add a WHERE condition
- `.execute()` - Execute aggregation and return array of grouped results

### Aggregate Functions

Import these functions from `@taylordb/query-builder`:
- `count(field)` - Count records
- `sum(field)` - Sum numeric values
- `avg(field)` - Average numeric values
- `min(field)` - Minimum value
- `max(field)` - Maximum value

## Common Mistakes to Avoid

**⚠️ CRITICAL: The following methods DO NOT EXIST and will cause errors:**

- ❌ `.countRecords()` - **DOES NOT EXIST**
- ❌ `.getCount()` - **DOES NOT EXIST**
- ❌ `.length` - **DOES NOT EXIST** on query builder chains

**Note**: `.count()` DOES exist for `selectFrom` queries. See the "Counting Records" section below for proper usage.

## Usage Examples

### Selecting Data

You can select data from a table using the `selectFrom` method. You can specify which fields to return, and you can filter, sort, and paginate the results.

```typescript
const customers = await qb
  .selectFrom('customers')
  .select(['firstName', 'lastName'])
  .where('firstName', '=', 'John')
  .orderBy('lastName', 'asc')
  .paginate(1, 10)
  .execute();
```

### Counting Records

There are two ways to count records in TaylorDB, each suited for different use cases:

#### Method 1: Using `.count()` on `selectFrom` (Recommended for simple counts)

**Use this when**: You need a single count value and don't need grouping or multiple metrics.

```typescript
// Count all users - returns a number directly
const totalUsers = await qb
  .selectFrom('users')
  .count();

console.log(`Total users: ${totalUsers}`);

// Count with filters - respects all WHERE conditions
const activeUsers = await qb
  .selectFrom('users')
  .where('status', '=', 'active')
  .where('age', '>', 18)
  .count();

console.log(`Active adult users: ${activeUsers}`);

// Count with relation filters
const usersWithPosts = await qb
  .selectFrom('users')
  .where('posts', 'isNotEmpty')
  .count();

console.log(`Users with posts: ${usersWithPosts}`);
```

**Key Points:**
- `.count()` returns `Promise<number>` directly (not an array)
- Works with all `selectFrom` chain methods (`.where()`, `.orderBy()`, etc.)
- Simple and efficient for single count values
- No need to import `count` function or use destructuring

#### Method 2: Using `aggregateFrom` with `count()` function (For grouped counts or multiple metrics)

**Use this when**: You need counts grouped by field(s) or multiple aggregate metrics.

```typescript
import { count } from '@taylordb/query-builder';

// Count grouped by status (returns array of results)
const statusCounts = await qb
  .aggregateFrom('users')
  .groupBy('status', 'asc')
  .metrics({
    total: count('id'),
  })
  .execute();

// Find specific status count
const activeCount = statusCounts.find(item => item.status === 'active')?.total || 0;

// Multiple metrics with grouping
const userStats = await qb
  .aggregateFrom('users')
  .groupBy('status', 'asc')
  .metrics({
    total: count('id'),
    averageAge: avg('age'),
  })
  .execute();
```

**Key Points:**
- Must import `count` function from `@taylordb/query-builder`
- Returns an array of grouped results
- Use when you need grouping or multiple aggregate functions
- More flexible but slightly more verbose for simple counts

#### When to Use Which Method

- **Use `.count()`** when: You need a single count value (e.g., total users, active orders, etc.)
- **Use `aggregateFrom`** when: You need counts grouped by field(s) or multiple aggregate metrics together

### Inserting Data

You can insert data into a table using the `insertInto` method.

```typescript
const newCustomer = await qb
  .insertInto('customers')
  .values({
    firstName: 'Jane',
    lastName: 'Doe',
  })
  .execute();
```

### Updating Data

You can update data in a table using the `update` method.

```typescript
const { affectedRecords } = await qb
  .update('customers')
  .set({ lastName: 'Smith' })
  .where('id', '=', 1)
  .execute();
```

### Deleting Data

You can delete data from a table using the `deleteFrom` method.

```typescript
const { affectedRecords } = await qb
  .deleteFrom('customers')
  .where('id', '=', 1)
  .execute();
```

### Aggregation Queries

You can perform powerful aggregation queries using the `aggregateFrom` method. You can group by one or more fields and specify aggregate functions to apply.

```typescript
import { count, sum, avg, max, min } from '@taylordb/query-builder';

const aggregates = await qb
  .aggregateFrom('orders')
  .groupBy('status', 'asc')
  .metrics({
    orderCount: count('id'),
    totalRevenue: sum('total'),
    averageOrder: avg('total'),
    maxOrder: max('total'),
    minOrder: min('total'),
  })
  .execute();
```

### Transactions

You can execute a series of operations within a single atomic transaction. If any operation within the transaction fails, all previous operations will be rolled back.

```typescript
const newCustomer = await qb.transaction(async tx => {
  const customer = await tx
    .insertInto('customers')
    .values({
      firstName: 'John',
      lastName: 'Doe',
    })
    .executeTakeFirst();

  if (!customer) {
    throw new Error('Customer creation failed.');
  }

  await tx
    .insertInto('orders')
    .values({
      customerId: customer.id,
      orderDate: new Date().toISOString(),
      total: 100,
    })
    .execute();

  return customer;
});
```

### Handling Attachments

You can upload files and associate them with your records using the `uploadAttachments` method. This is useful for handling things like user avatars, product images, or any other file-based data.

First, upload the file(s) to get `Attachment` instances:

```typescript
const filesToUpload = [
  { file: new Blob(['file content']), name: 'avatar.png' },
];
const attachments = await qb.uploadAttachments(filesToUpload);
```

Then, you can use the returned `Attachment` instances when creating or updating records. The query builder will automatically convert them into the correct format.

```typescript
// Create a new customer with an avatar
const newCustomer = await qb
  .insertInto('customers')
  .values({
    firstName: 'Jane',
    lastName: 'Doe',
    avatar: attachments[0], // Use the Attachment instance
  })
  .executeTakeFirst();

// Update an existing customer's avatar
const { affectedRecords } = await qb
  .update('customers')
  .set({
    avatar: attachments[0], // Use the Attachment instance
  })
  .where('id', '=', 1)
  .execute();
```

### Batch Queries

You can execute multiple queries in a single batch request for improved performance. The result will be a tuple that corresponds to the results of each query in the batch.

```typescript
const [customers, newCustomer] = await qb
  .batch([
    qb.selectFrom('customers').select(['firstName', 'lastName']),
    qb.insertInto('customers').values({ firstName: 'John', lastName: 'Doe' }),
  ])
  .execute();
```

## Best Practices for Performance

When working with large databases, optimizing your queries is crucial for fast and efficient data retrieval. Here are some best practices to follow:

### 1. Select Only Necessary Fields

To minimize data transfer and improve query speed, always select only the fields you need. Avoid fetching all columns from a table if you only require a subset of them.

**Bad Practice:**
```typescript
// Fetches all fields for all customers, which can be slow with large tables.
const customers = await qb
  .selectFrom('customers')
  .selectAll()
  .execute();
```

**Good Practice:**
```typescript
// Fetches only the required fields, leading to a faster and more efficient query.
const customers = await qb
  .selectFrom('customers')
  .select(['firstName', 'lastName', 'email'])
  .execute();
```

### 2. Use Aggregations for Metrics and Dashboards

When building dashboards or calculating metrics (e.g., total sales, user counts), it's more efficient to perform aggregations directly in the database rather than fetching raw data and processing it in your application. The `aggregateFrom` method is optimized for this purpose.

**Bad Practice (less efficient):**
```typescript
// Fetches all orders and then calculates the total count in the application.
const orders = await qb
  .selectFrom('orders')
  .select(['id'])
  .execute();

const totalOrders = orders.length;
```

**Good Practice (more efficient):**
```typescript
// For simple counts, use .count() method - simpler and more efficient
const totalOrders = await qb
  .selectFrom('orders')
  .count();

// Or if you need grouping, use aggregateFrom
import { count } from '@taylordb/query-builder';
const [{ totalOrders }] = await qb
  .aggregateFrom('orders')
  .metrics({
    totalOrders: count('id'),
  })
  .execute();
```

**Example: Counting records grouped by status**

```typescript
import { count } from '@taylordb/query-builder';

// Count tasks by status - returns array of grouped results
const statusCounts = await qb
  .aggregateFrom('tasks')
  .groupBy('status', 'asc')
  .metrics({
    total: count('id'),
  })
  .execute();

// Extract specific counts
const doneCount = statusCounts.find(item => item.status === 'Done')?.total || 0;
const pendingCount = statusCounts.find(item => item.status === 'Pending')?.total || 0;
```

**Example: Simple counts for individual metrics**

```typescript
// For simple counts without grouping, use .count() method
const totalDone = await qb
  .selectFrom('tasks')
  .where('status', '=', 'Done')
  .count();

const totalPending = await qb
  .selectFrom('tasks')
  .where('status', '=', 'Pending')
  .count();
```

**Alternative: Using batch queries for multiple filtered counts**

```typescript
// If you need multiple simple counts, batch queries can be efficient
const [totalDone, totalPending] = await qb.batch([
  qb.selectFrom('tasks').where('status', '=', 'Done').count(),
  qb.selectFrom('tasks').where('status', '=', 'Pending').count(),
]);
```

**Note**: 
- Use `.count()` for simple single counts (most efficient)
- Use `aggregateFrom` with `groupBy` when you need counts grouped by field(s)
- Use `batch` when you need multiple different filtered counts in parallel

Using aggregations reduces the amount of data transferred over the network and leverages the database's power for calculations, resulting in better performance for your application.

## Recipes

### Select with Relations

You can use the `with` method to fetch related records from a linked table.

```typescript
// Assuming 'customers' has a link field 'orders' to the 'orders' table
const customersWithOrders = await qb
  .selectFrom('customers')
  .select(['firstName', 'lastName'])
  .with({
    orders: qb => qb.select(['orderDate', 'total']),
  })
  .execute();
```

### Cross-Filters

You can filter records in one table based on the values in a linked table.

```typescript
// Get all customers who have placed an order with a total greater than 100
const highValueCustomers = await qb
  .selectFrom('customers')
  .where('orders', 'hasAnyOf', qb => qb.where('total', '>', 100))
  .execute();
```

### Conditional Updates

You can use `where` clauses to update only the records that match a specific condition.

```typescript
// Update the status of all orders placed before a certain date
const { affectedRecords } = await qb
  .update('orders')
  .set({ status: 'archived' })
  .where('orderDate', '<', '2023-01-01')
  .execute();
```
