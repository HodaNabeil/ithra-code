# 📚 Lectures API - Quick Start Guide

## 🎯 What Was Added

A complete **Lectures** section in Swagger/OpenAPI documentation with 4 endpoints for managing
course lectures.

---

## 🌐 View Documentation

### Swagger UI (Interactive)

```
http://localhost:3000/docs
```

Navigate to the **"Lectures"** section to see all endpoints.

### Raw OpenAPI JSON

```
http://localhost:3000/api/openapi
```

---

## 📋 API Endpoints

### 1️⃣ Get Lecture Details

**`GET /api/lectures/{lectureId}`**

✅ **Status**: Implemented

```bash
curl -X GET 'http://localhost:3000/api/lectures/cllecture2k4m00008l5d6e3k1n' \
  --cookie 'authjs.session-token=YOUR_SESSION_TOKEN'
```

**Response**:

```json
{
  "success": true,
  "message": "تم جلب المحاضرة بنجاح",
  "data": {
    "lecture": {
      "id": "cllecture2k4m00008l5d6e3k1n",
      "title": "مقدمة إلى Node.js",
      "type": "VIDEO",
      "videoHlsUrl": "https://...",
      "isPublished": true,
      "isFree": false
    },
    "course": {
      "id": "clg2v3z5f000008l5d6e3k1n",
      "title": "Node.js - دورة شاملة",
      "slug": "nodejs-complete-guide"
    },
    "hasPurchased": true,
    "hasRated": false
  }
}
```

---

### 2️⃣ Create Lecture

**`POST /api/lectures`**

📝 **Status**: Documented (not yet implemented)

```bash
curl -X POST 'http://localhost:3000/api/lectures' \
  --cookie 'authjs.session-token=YOUR_SESSION_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{
    "sectionId": "clsection2k4m00008l5d6e3k1n",
    "title": "مقدمة إلى Node.js",
    "description": "في هذه المحاضرة سنتعرف على Node.js",
    "type": "VIDEO",
    "position": 1,
    "isPublished": false,
    "isFree": false
  }'
```

**Expected Response** (201 Created):

```json
{
  "success": true,
  "message": "تم إنشاء المحاضرة بنجاح",
  "data": {
    "id": "cllecture2k4m00008l5d6e3k1n",
    "sectionId": "clsection2k4m00008l5d6e3k1n",
    "title": "مقدمة إلى Node.js",
    "type": "VIDEO",
    "position": 1,
    "isPublished": false
  }
}
```

---

### 3️⃣ Update Lecture

**`PUT /api/lectures/{lectureId}`**

📝 **Status**: Documented (not yet implemented)

```bash
curl -X PUT 'http://localhost:3000/api/lectures/cllecture2k4m00008l5d6e3k1n' \
  --cookie 'authjs.session-token=YOUR_SESSION_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{
    "title": "مقدمة إلى Node.js - محدثة",
    "isPublished": true
  }'
```

**Expected Response** (200 OK):

```json
{
  "success": true,
  "message": "تم تحديث المحاضرة بنجاح",
  "data": {
    "id": "cllecture2k4m00008l5d6e3k1n",
    "title": "مقدمة إلى Node.js - محدثة",
    "isPublished": true
  }
}
```

---

### 4️⃣ Delete Lecture

**`DELETE /api/lectures/{lectureId}`**

📝 **Status**: Documented (not yet implemented)

```bash
curl -X DELETE 'http://localhost:3000/api/lectures/cllecture2k4m00008l5d6e3k1n' \
  --cookie 'authjs.session-token=YOUR_SESSION_TOKEN'
```

**Expected Response** (200 OK):

```json
{
  "success": true,
  "message": "تم حذف المحاضرة بنجاح",
  "data": {
    "id": "cllecture2k4m00008l5d6e3k1n",
    "title": "مقدمة إلى Node.js"
  }
}
```

---

## 🔐 Authentication

All endpoints require authentication via NextAuth session cookie:

- **Cookie name**: `authjs.session-token`
- **Auth method**: Session-based (set after OAuth or credentials login)

In Swagger UI, use the **"Authorize"** button to set your session token.

---

## 📝 Lecture Types

| Type         | Description          | Use Case                  |
| ------------ | -------------------- | ------------------------- |
| `VIDEO`      | Video content        | Main lecture videos       |
| `TEXT`       | Text/article content | Reading materials, guides |
| `QUIZ`       | Quiz/assessment      | Knowledge checks          |
| `ASSIGNMENT` | Homework/project     | Practical exercises       |

---

## ✅ Validation Rules

### Create/Update Lecture

- **`sectionId`**: Must be a valid CUID
- **`title`**: Required, minimum 1 character
- **`type`**: Must be one of: VIDEO, TEXT, QUIZ, ASSIGNMENT
- **`position`**: Integer (for ordering)
- **`isPublished`**: Boolean (default: false)
- **`isFree`**: Boolean (default: false)

---

## 🎨 Example IDs (Seeded Data)

Use these IDs for testing with seeded database:

- **Course ID**: `clg2v3z5f000008l5d6e3k1n`
- **Section ID**: `clsection2k4m00008l5d6e3k1n`
- **Lecture ID**: `cllecture2k4m00008l5d6e3k1n`
- **Instructor ID**: `clinstr2k4m00008l5d6e3k1n`

---

## 🔒 Permissions

| Endpoint | Required Permission   | Notes                                 |
| -------- | --------------------- | ------------------------------------- |
| GET      | `LECTURE_READ`        | Must be enrolled or instructor/admin  |
| POST     | Instructor/Admin role | Creates unpublished by default        |
| PUT      | Instructor/Admin role | Must own the course                   |
| DELETE   | Instructor/Admin role | Must own the course, permanent action |

---

## 🧪 Testing in Swagger UI

1. **Start the dev server**:

   ```bash
   pnpm dev
   ```

2. **Open Swagger UI**:

   ```
   http://localhost:3000/docs
   ```

3. **Authenticate**:
   - Click "Authorize" button
   - Enter your session token
   - Click "Authorize" again

4. **Try the GET endpoint**:
   - Navigate to "Lectures" section
   - Click "GET /lectures/{lectureId}"
   - Click "Try it out"
   - Enter a lecture ID
   - Click "Execute"

---

## 📁 Files Modified

- **`src/lib/swagger.ts`**: Added Lectures section with 4 endpoints, schemas, and examples

---

## 🚀 Next Steps

To implement the documented endpoints (POST, PUT, DELETE):

1. Create route handlers in `src/app/api/lectures/`
2. Follow patterns from `src/features/courses/lecture-detail/`
3. Implement use cases with proper authorization
4. Use Zod schemas for validation
5. Return API responses matching the documented structure

---

## 📚 Related Documentation

- Full implementation details: `.docs/lectures-api-swagger-implementation.md`
- OpenAPI spec preview: `.docs/lectures-openapi-spec-preview.json`
- Project architecture: `AGENTS.md`
- Existing lecture feature: `src/features/courses/lecture-detail/`

---

**Happy coding! 🎉**
