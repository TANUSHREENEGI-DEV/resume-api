# Resume-API 

This is the backend for **ResumeFlow**, my AI resume builder project. It's a REST API built with Express that handles everything from auth to documents to a mock AI layer — and now it actually saves data instead of forgetting everything the moment the server restarts.

I built this as part of my Full Stack internship . Earlier version had all the routes working but data only lived in memory. This version fixes that — every write goes to `data.json` on disk, for real.

More recently (Day 18), I started a parallel track exploring **Sequelize + MySQL** as a real database layer, alongside the existing `data.json` system. That work lives in its own set of files, described further down.

---

## ● What it does

- User auth (register/login/logout, mock password reset)
- User profile management
- Full document CRUD — resumes can have sections, and sections can have items (like experience entries), plus a version history so you can roll back edits
- A templates list to pick a resume layout
- A mock AI layer (bullet point rewriting, summaries) that spends "AI credits"
- A job application tracker (company, role, status)

---

## ● Tech stack

- **Node.js + Express** — the server
- **`data.json`** — file-based storage, the main persistence for the app right now
- **Sequelize + MySQL** — a second, parallel persistence layer I'm learning (Day 18), not yet wired into the main app
- **Postman** — for testing routes manually

---

## ● Folder structure

```
resume-api/
├── app.js                  # express setup, mounts the central router, applies middleware
├── db.js                   # tiny "database" - loads/saves data.json
├── data.json               # the actual data (users, documents, etc.)
├── package.json
├── config/
│   └── database.js         # Sequelize connection to MySQL (resume_db)
├── middleware/
│   ├── mockAuth.js         # attaches a seed user to every request
│   └── logger.js           # logs every incoming request (method + url)
├── models/                 # only reads/writes data, nothing else
│   ├── userModel.js        # data.json based - existing app
│   ├── documentModel.js    # data.json based - existing app
│   ├── templateModel.js    # data.json based - existing app
│   ├── applicationModel.js # data.json based - existing app
│   ├── user.js              # Sequelize User model (MySQL)
│   ├── resume.js            # Sequelize Resume model (MySQL)
│   └── index.js              # loads Sequelize models, wires up associate()
├── controllers/            # the actual business logic - validation, responses
│   ├── authController.js
│   ├── userController.js
│   ├── documentController.js
│   ├── templateController.js
│   ├── aiController.js
│   └── applicationController.js
├── routes/
│   ├── index.js             # central router - collects every sub-router under /api
│   ├── auth.js               # just wires paths to authController
│   ├── users.js               # just wires paths to userController
│   ├── documents.js           # just wires paths to documentController
│   ├── templates.js           # just wires paths to templateController
│   ├── ai.js                  # just wires paths to aiController
│   └── applications.js        # just wires paths to applicationController
├── syncDb.js                  # runs sequelize.sync(), creates Users/Resumes tables
├── createUser.js               # creates one real user through the Sequelize model
├── createResumes.js             # creates two resumes for that user
├── readResumeWithOwner.js        # findByPk with include: User (a real SQL join)
├── updateResume.js                # updates a resume title with .save()
└── testForbidden.js                # tries a duplicate email, on purpose, to see MySQL reject it
```

Started as one file per resource with routes and logic mixed together. Refactored in Module 3 / Day 15 to properly separate concerns: **routes** decide which URL maps to which function, **controllers** hold the actual logic, and **models** are the only files allowed to touch `db.data` directly. Every request also passes through a `logger` middleware first, so every hit shows up in the console as `METHOD /path`.

### ▸ What each layer actually does

| Layer | Job | Example |
|---|---|---|
| **Route** (`routes/*.js`) | Maps a URL + method to a controller function. No logic here. | `router.post("/login", controller.login)` |
| **Controller** (`controllers/*.js`) | Validates the request, calls the model, decides the response and status code. | Checks `email`/`password` are present, calls `userModel.findByEmail`, returns `401` if it doesn't match |
| **Model** (`models/*.js`) | The only place allowed to read or write `db.data`. Controllers never touch it directly. | `userModel.findByEmail(email)`, `userModel.create(data)` |

The point of splitting it this way: if the data storage ever changes (say, a real database instead of `data.json`), only the `models/` files need to change — routes and controllers stay untouched because they only ever talk to the model functions, never to `db.js` directly.

---

## ● How persistence actually works

This was the whole point of this update. `db.js` keeps one in-memory copy of `data.json`. Models are the only files that touch `db.data` — every model function that changes something calls `db.save()` right after, which writes the whole object back to disk.

```mermaid
sequenceDiagram
    participant Client
    participant Route as Route
    participant Controller
    participant Model as applicationModel
    participant DB as db.js
    participant File as data.json

    Client->>Route: POST /api/applications
    Route->>Controller: create(req, res)
    Controller->>Model: applicationModel.create(data)
    Model->>DB: db.data.applications.push(newApp)
    Model->>DB: db.save()
    DB->>File: fs.writeFileSync(data)
    File-->>DB: written
    DB-->>Model: done
    Model-->>Controller: newApp
    Controller-->>Client: 201 Created + new application
```

No model is allowed to mutate `db.data` and skip the save step — that was the bug in an earlier version.

---

## ● Data model

```mermaid
classDiagram
    class User {
        +string id
        +string name
        +string email
        +string password
        +string tier
        +number aiCredits
    }

    class Document {
        +string id
        +string userId
        +string title
        +string type
        +string templateId
        +Section[] sections
        +Version[] versions
    }

    class Section {
        +string id
        +string type
        +string title
        +number order
        +Item[] items
    }

    class Item {
        +string id
        +string role
        +string company
        +string description
    }

    class Version {
        +string id
        +string createdAt
        +Section[] snapshot
    }

    class Application {
        +string id
        +string userId
        +string company
        +string role
        +string status
    }

    User "1" --> "many" Document
    Document "1" --> "many" Section
    Section "1" --> "many" Item
    Document "1" --> "many" Version
    User "1" --> "many" Application
```

---

## ● Document version lifecycle

A document doesn't just get overwritten when you edit it — you can save a version snapshot and restore it later if you mess something up.

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Versioned: save version
    Versioned --> Draft: continue editing
    Draft --> Restored: restore old version
    Restored --> Draft: continue editing
    Draft --> [*]: delete document
```

---

## ● API routes

### ▸ Auth (`/api/auth`)
| Method | Route | What it does |
|---|---|---|
| POST | `/register` | creates a new user |
| POST | `/login` | returns a mock token |
| POST | `/logout` | mock logout |
| POST | `/forgot-password` | generates a reset token |
| POST | `/reset-password` | sets a new password using that token |

### ▸ Users (`/api/users`)
| Method | Route | What it does |
|---|---|---|
| GET | `/me` | current user's profile |
| PUT | `/me` | update name/email |
| DELETE | `/me` | deletes account + their documents + applications |

### ▸ Documents (`/api/documents`)
| Method | Route | What it does |
|---|---|---|
| GET | `/hello` | simple check route, returns a fixed message |
| GET | `/` | list my documents |
| POST | `/` | create a new document |
| POST | `/import` | create a document from imported content |
| GET | `/:id` | get one document |
| PUT | `/:id` | update title/sections |
| POST | `/:id/duplicate` | clone a document |
| DELETE | `/:id` | delete a document |
| POST | `/:id/sections` | add a section |
| PATCH | `/:id/sections/:sectionId` | update a section |
| DELETE | `/:id/sections/:sectionId` | remove a section |
| POST | `/:id/sections/:sectionId/items` | add an item to a section |
| PATCH | `/:id/sections/:sectionId/items/:itemId` | update an item |
| DELETE | `/:id/sections/:sectionId/items/:itemId` | remove an item |
| GET | `/:id/versions` | list saved versions |
| POST | `/:id/versions` | save current state as a version |
| POST | `/:id/versions/:versionId/restore` | roll back to that version |

### ▸ Templates (`/api/templates`)
| Method | Route | What it does |
|---|---|---|
| GET | `/` | list available templates |
| GET | `/:id` | get one template |

### ▸ AI (`/api/ai`) — mock, costs 1 credit per call
| Method | Route | What it does |
|---|---|---|
| POST | `/bullets` | rewrites bullet points |
| POST | `/summary` | rewrites a summary |
| POST | `/rewrite` | general rewrite |
| POST | `/prompt` | rewrite with a custom instruction |

### ▸ Applications (`/api/applications`)
| Method | Route | What it does |
|---|---|---|
| GET | `/` | list my job applications |
| POST | `/` | add a new application |
| PATCH | `/:id` | update status/company/role |
| DELETE | `/:id` | remove an application |

---

## ● Running it locally

```bash
npm install
node app.js
```

Server runs at `http://localhost:3000`. There's no real login yet — every request is treated as the seed user (`u1`) in `data.json`, through `middleware/mockAuth.js`. Real auth is a later module.

Test it with Postman or `Invoke-RestMethod` (curl gets weird with quotes in PowerShell, learned that the hard way):

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/applications" -Method Post -ContentType "application/json" -Body '{"company":"Google","role":"SWE Intern"}'
```

Then check `data.json` — the new entry should be sitting right there, saved on disk, not just in memory.

---

## ● Tested and working

Ran every route through Postman before calling this done — here's proof the persistence actually works.

**GET `/api/documents`** — returns the seed document, confirming the server reads from `data.json` correctly:

<img width="1907" height="1025" alt="Screenshot 2026-07-15 030741" src="https://github.com/user-attachments/assets/7271b5f9-5f12-45af-9ea3-ab82a1c446a2" />

**POST `/api/applications`** — created a new job application, got back a clean `201 Created`. Checked `data.json` right after and the entry was sitting there on disk, not just in memory:

<img width="1915" height="1022" alt="Screenshot 2026-07-15 031417" src="https://github.com/user-attachments/assets/bdc0efb9-b491-4c44-8dd0-1273836c0c37" />

### ▸ Re-verified after the Day 15 refactor

Moving all the logic into controllers and models could easily have broken something silently, so I re-ran the same two requests against the new structure before pushing.

**GET `/api/documents`** — still returns the seed document correctly through the new `documentController` → `documentModel` path:

<img width="1915" height="1016" alt="Screenshot 2026-07-16 034741" src="https://github.com/user-attachments/assets/9221d37a-68fd-41ea-9099-bf16f2520571" />


**POST `/api/applications`** — still returns `201 Created` with the `status` field intact through the new `applicationController` → `applicationModel` path:

<img width="1917" height="1022" alt="Screenshot 2026-07-16 034945" src="https://github.com/user-attachments/assets/5e279406-a5ee-4f73-8c7d-13a79acebd84" />

### ▸ Day 15 checkpoint: hello route

The class exercise was to trace one simple route end to end through the new structure before moving to full CRUD. Added `GET /api/documents/hello`, tested in Postman:

<img width="1917" height="1017" alt="Screenshot 2026-07-17 132435" src="https://github.com/user-attachments/assets/8ddeb89f-3d99-42bc-8445-ec9d112a33ee" />

---

## ● Day 18: Sequelize + MySQL (learning track)

Yesterday I created a database and a `users` table by hand in Workbench, and wrote raw `INSERT`/`SELECT` myself. This class was about doing the same work from JavaScript, through Sequelize models, one operation at a time — and confirming every step in Workbench so I could see the same rows the code was creating.

This is a separate, exploratory layer sitting next to the existing `data.json` app. It uses its own model files (`models/user.js`, `models/resume.js`, `models/index.js`) so nothing in the main app was touched.

```mermaid
flowchart LR
    A[config/database.js] -->|connects to| B[(MySQL: resume_db)]
    C[models/user.js] --> D[models/index.js]
    E[models/resume.js] --> D
    D -->|sequelize.sync| B
    D -->|User.hasMany Resume| B
```

### ▸ Step 1 — connect and create the tables

Ran `node syncDb.js`, which calls `sequelize.sync()`. This builds the `Users` and `Resumes` tables from the model definitions if they don't already exist.

<img width="1917" height="1020" alt="Screenshot 2026-07-25 022151" src="https://github.com/user-attachments/assets/8418ac3c-e731-412b-a96b-bb1f241bf5f5" />

Confirmed in Workbench with `SHOW TABLES;` — both `users` and `resumes` showed up.

<img width="1917" height="1020" alt="Screenshot 2026-07-25 022553" src="https://github.com/user-attachments/assets/a92ba4d4-74d0-46cb-b87f-f5338aa74869" />

### ▸ Step 2 — create a real user

Ran `node createUser.js`, which calls `User.create()` with my own name and email. The `beforeCreate` hook on the model hashes the password with bcrypt before it ever touches the database.

<img width="1917" height="1020" alt="Screenshot 2026-07-25 023242" src="https://github.com/user-attachments/assets/80ca9485-c749-4a5c-9eca-11416669d013" />

Confirmed in Workbench with `SELECT * FROM users;` — my row was there, and the `password` column showed a hashed string, not the plain text I typed in.

<img width="1917" height="1018" alt="Screenshot 2026-07-25 023534" src="https://github.com/user-attachments/assets/740900b9-b216-46fa-90ad-abf03d2db723" />

### ▸ Step 3 — create two resumes for that user

Ran `node createResumes.js`, which calls `Resume.create()` twice with my `user.id` as the foreign key, then reads them back with `findAll`.

<img width="1917" height="1020" alt="Screenshot 2026-07-25 023751" src="https://github.com/user-attachments/assets/6c286a71-4f61-4f88-af42-a45d70cd9ace" />

### ▸ Step 4 — read a resume with its owner (a join)

Ran `node readResumeWithOwner.js`, which uses `Resume.findByPk(id, { include: User })`. Sequelize wrote a real `LEFT OUTER JOIN` behind the scenes and attached the owner as `first.User`.

<img width="1917" height="1018" alt="Screenshot 2026-07-25 023930" src="https://github.com/user-attachments/assets/1c3d86ae-4c4d-49d7-898d-0a2c48e5dbdb" />

### ▸ Step 5 — update a saved row

Ran `node updateResume.js`, which changes `first.title` and calls `first.save()`. Sequelize knew exactly which row to update from the object's `id`, so it wrote a targeted `UPDATE ... WHERE id = 1` and refreshed `updatedAt` automatically.

<img width="1917" height="1020" alt="Screenshot 2026-07-25 024309" src="https://github.com/user-attachments/assets/f2bcebf0-91c1-4eee-89f9-786694dd17fb" />

Confirmed in Workbench with `SELECT * FROM resumes;` — the title change was there.

<img width="1917" height="1018" alt="Screenshot 2026-07-25 024401" src="https://github.com/user-attachments/assets/2f3336d0-1395-4908-b524-49ea28fbdc83" />

### ▸ Step 6 — try a forbidden thing on purpose

Ran `node testForbidden.js`, which tries to create a second user with an email that's already in the table. The `unique: true` rule on the model is enforced by MySQL itself, not by my JavaScript — the insert never happened, and Sequelize threw a `SequelizeUniqueConstraintError` (`ER_DUP_ENTRY`) instead.

<img width="1917" height="1018" alt="Screenshot 2026-07-25 024629" src="https://github.com/user-attachments/assets/b7774b3f-4977-430b-9085-615e4b8dbe6e" />

### ▸ What `sequelize.sync()` does, and why not `force: true`

`sequelize.sync()` looks at all the models I have defined (`User`, `Resume`) and checks if matching tables exist in the MySQL database. If a table doesn't exist yet, it creates it based on the model definition. If the table already exists, `sync()` leaves it alone and does not touch the existing data. This is why I could run `node syncDb.js` multiple times without losing anything — it only builds what's missing.

`sequelize.sync({ force: true })` works differently: it drops every existing table first and then recreates them from scratch. That means all data in the table gets deleted before the new empty table is made. I never used `force: true` in this task because I already had real data (a user and their resumes) sitting in those tables, and running it would have wiped everything I had just created. `force: true` is only safe to use early in development, before any real data exists, or when you deliberately want a clean slate.

---

## ● Day 22-24: Full schema, hashed auth, and real JWT

This is where the Sequelize track (started Day 18) grew into the app's actual database layer, and where auth stopped being mocked. Three days: build the full 9-table schema, layer register/login/reset on top of it with hashed passwords, then swap the mock tokens for real signed JWTs.

### ▸ Day 22 — the full schema

9 tables, one `model:generate` command each:

```
npx sequelize-cli model:generate --name User --attributes name:string,email:string,password:string,tier:enum:'{free,pro}',aiCredits:integer
npx sequelize-cli model:generate --name Template --attributes name:string,config:text
npx sequelize-cli model:generate --name Document --attributes title:string,type:enum:'{resume,cover_letter}',userId:integer,templateId:integer
npx sequelize-cli model:generate --name Section --attributes heading:string,position:integer,documentId:integer
npx sequelize-cli model:generate --name Item --attributes content:text,position:integer,sectionId:integer
npx sequelize-cli model:generate --name Version --attributes snapshot:text,label:string,documentId:integer
npx sequelize-cli model:generate --name Application --attributes company:string,role:string,status:enum:'{saved,applied,interview,offer,rejected}',userId:integer,documentId:integer
npx sequelize-cli model:generate --name Share --attributes slug:string,documentId:integer
npx sequelize-cli model:generate --name Export --attributes format:enum:'{pdf,docx}',fileUrl:string,documentId:integer,userId:integer
```

Each command creates two files that already match each other: a **model** in `models/` (what my code talks to every day) and a **migration** in `migrations/` (the one-time instructions that build the table). Kept mixing these up at first — the migration builds the shelf, the model is how I put things on and take things off that shelf.

```mermaid
classDiagram
    class User {
        +id
        +name
        +email
        +password
        +tier
        +aiCredits
    }
    class Template {
        +id
        +name
        +config
    }
    class Document {
        +id
        +title
        +type
        +userId
        +templateId
    }
    class Section {
        +id
        +heading
        +position
        +documentId
    }
    class Item {
        +id
        +content
        +position
        +sectionId
    }
    class Version {
        +id
        +snapshot
        +label
        +documentId
    }
    class Application {
        +id
        +company
        +role
        +status
        +userId
        +documentId
    }
    class Share {
        +id
        +slug
        +documentId
    }
    class Export {
        +id
        +format
        +fileUrl
        +documentId
        +userId
    }

    User "1" --> "many" Document
    Template "1" --> "many" Document
    Document "1" --> "many" Section
    Section "1" --> "many" Item
    Document "1" --> "many" Version
    User "1" --> "many" Application
    Document "1" --> "many" Application
    Document "1" --> "many" Share
    Document "1" --> "many" Export
    User "1" --> "many" Export
```

Filled in the blank `associate()` function Sequelize leaves in each model:

```javascript
Document.belongsTo(models.User, { foreignKey: 'userId' });
Document.belongsTo(models.Template, { foreignKey: 'templateId' });
Document.hasMany(models.Section, { foreignKey: 'documentId', onDelete: 'CASCADE' });
Document.hasMany(models.Version, { foreignKey: 'documentId', onDelete: 'CASCADE' });
Document.hasMany(models.Application, { foreignKey: 'documentId', onDelete: 'CASCADE' });
Document.hasMany(models.Share, { foreignKey: 'documentId', onDelete: 'CASCADE' });
Document.hasMany(models.Export, { foreignKey: 'documentId', onDelete: 'CASCADE' });
```

`belongsTo` means this table points to the other one. `hasMany` means the other table points back, potentially many times. `onDelete: CASCADE` means if the parent gets deleted, the connected rows get deleted automatically instead of turning into orphaned data.

Ran `npx sequelize-cli db:migrate` after this, and all 9 tables showed up in MySQL Workbench.

**What I ran into:** my project already had a `Resume` model and table from the Day 18 exercise above, so there was a small naming conflict with the new class schema's `Document`. Kept `Document` going forward since that's what the class uses, and left the old `Resume` table alone instead of deleting anything with real data in it.

**What I learned:** a migration is instructions, run once, to build a table — a model is what my running code uses every day. The foreign key is a column in the database; the association is what tells Sequelize how to use that column to actually pull related data together. `onDelete: CASCADE` matters — I don't want orphaned sections and versions sitting around with no parent document.

### ▸ Day 23 — register, password hashing, Promises

Built `/api/auth/register` — takes name/email/password, checks the email isn't already used, saves the user, and returns a token right away so they're logged in immediately after signing up. Still a mock token at this point:

<img src="./screenshots/day22-24/register-mock-token.png" alt="Register endpoint returning a mock token" width="900" />

A password should never be stored the way it was typed. I used `bcrypt.hash()` to scramble it before saving — what actually sits in my database is that scrambled version, never the real password. Hashing is one-way on purpose: even I, looking directly at my own database, can't read anyone's real password. At login, I hash whatever was just typed and compare the two scrambled versions with `bcrypt.compare()` instead of comparing plain text.

A Promise is how JavaScript handles something that takes time without freezing everything else while it waits. Three states — pending, resolved, rejected. `.then()` runs on success, `.catch()` runs on failure. Wrote a small demo to see this behave for real:

```javascript
function checkAge(age) {
  return new Promise(function (resolve, reject) {
    if (age >= 18) {
      resolve("age check passed, user is an adult");
    } else {
      reject("age check failed, user is a minor");
    }
  });
}

checkAge(21)
  .then(function (result) {
    console.log("success:", result);
  })
  .catch(function (error) {
    console.log("error:", error);
  });

checkAge(15)
  .then(function (result) {
    console.log("success:", result);
  })
  .catch(function (error) {
    console.log("error:", error);
  });
```

<img src="./screenshots/day22-24/promise-demo-terminal.png" alt="Terminal output of the checkAge Promise demo" width="900" />

Before Promises, chained slow steps were handled with callbacks nested inside callbacks — the code drifts to the right the deeper it goes, and error handling gets messy at every level. Promises flatten that into one `.then` chain. `async/await` goes a step further — the slow steps read top to bottom like normal synchronous code, and all the error handling lives in one `try/catch` instead of being scattered. This is exactly why `register` and `login` in `authController.js` are `async` functions using `await bcrypt.hash(...)` instead of chaining `.then()` calls everywhere.

### ▸ Day 24 — real JWT auth

Day 23 got register/login/hashing working with mock tokens (`mock-token-${user.id}`). Day 24 replaced those with real signed JWTs, and covered how tokens and npm package versions actually work.

- **Register** — hashes the password, saves the user, returns a real JWT so the user is logged in right after signup
- **Login** — checks the typed password against the stored hash with `bcrypt.compare()`, returns a fresh token if it matches
- **Reset password** — replaces the stored hash with a new one, so the old password stops working immediately

```javascript
const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET;

const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: "7d" });
```

The secret lives in `.env`, never hardcoded in the file itself.

A JWT is three parts joined by dots — `header.payload.signature`. The payload holds data like the user id, and anyone with the token can read it (confirmed this on jwt.io — the payload decodes without needing any secret), so nothing sensitive ever goes in there. The signature is made with the server's secret key — change even one character of the token, and `jwt.verify()` rejects it instantly. That's the whole security model behind one line: `jwt.verify(token, SECRET)`.

Also looked at npm versioning — a version is `MAJOR.MINOR.PATCH`, like `4.17.21`:

| Symbol | Example | Accepts |
|--------|---------|---------|
| none | `4.17.21` | exactly that version, nothing else |
| `~` (tilde) | `~4.17.21` | patch updates only — `4.17.22` |
| `^` (caret) | `^4.17.21` | minor + patch — `4.18.0`, `4.99.9`, never `5.0.0` |

Checked my own `package.json` — everything uses `^`:

```json
"bcryptjs": "^3.0.3",
"express": "^5.2.1",
"jsonwebtoken": "^9.0.3",
"mysql2": "^3.23.1",
"sequelize": "^6.37.8"
```

So `npm install` can bump any of these to a newer minor or patch release automatically, but will never jump to a new major version on its own — because a major version bump can carry breaking changes.

### ▸ Proof it actually works

Tested the full auth flow through Postman rather than assuming it worked.

**Forgot password generates a reset token behind the scenes:**

<img src="./screenshots/day22-24/forgot-password-200.png" alt="Forgot-password endpoint returning 200" width="900" />

**Reset password actually updates the stored hash (200):**

<img src="./screenshots/day22-24/reset-password-200.png" alt="Reset-password endpoint returning 200" width="900" />

**The old password stops working immediately after reset (401):**

<img src="./screenshots/day22-24/login-401-old-password.png" alt="Login with the old password rejected with 401" width="900" />

Also confirmed directly in `data.json` that every registered user's `password` field is a bcrypt hash (`$2b$10$...`), never the plain text that was typed in.

And on jwt.io — took a real token, decoded the payload to see my own user id sitting there in plain view, then changed one character of the encoded token and watched the signature verification flip to invalid.

**What I learned across these three days:**
- A migration builds the table once. A model is what the running app actually uses.
- Associations are how Sequelize turns a foreign key column into something my code can actually use to pull related data together.
- Hashing protects passwords even if the database itself gets compromised — that's the entire point of it being one-way.
- A JWT payload is readable by anyone holding the token. It's the signature, not secrecy of the payload, that makes it trustworthy.
- `async/await` isn't a different thing from Promises, it's a cleaner way of writing code that's already using them underneath.
- `^` in package.json is more permissive than I assumed — it can pull in a lot of minor version changes automatically, which is fine for patches and small features but still worth knowing about before assuming my dependencies are frozen.

---

## ● Wrapping up

Persistence verified through Postman at every step, full 9-table schema built with Sequelize, and auth is now running on real hashed passwords and signed JWTs instead of mocks. Next up: deciding if Sequelize/MySQL replaces `data.json` or stays separate, and wiring the JWT middleware into the rest of the protected routes.

---

~**tanushree**🪼
