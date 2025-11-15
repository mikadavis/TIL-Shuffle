# **AI Agent Coding Rules**

This document outlines the specific rules, API endpoints, and development standards to be followed by the AI coding agent for this project.

## **1\. Authentication & Setup**

### **1.1. API Key Management**

* The single API key for all services hosted on [https://api.wearables-ape.io](https://api.wearables-ape.io) is stored in the browser's local storage under the key ape-api-key.
* All API calls requiring authorization must retrieve this key from local storage and pass it as a Bearer token in the Authorization header.

### **1.2. API Key Management and Validation**

This section outlines the startup and validation logic for the user's API key, which is essential for all application functionality.

#### **On Application Load**

On initial application load, the following validation sequence **MUST** be executed:

1. **Check for Key:** Verify if a value for `ape-api-key` exists in `localStorage`.
2. **Check for Daily Validation:** Verify if a timestamp for `ape-api-key-last-validated` exists in `localStorage` and is less than 24 hours old.
3. **Initiate Flow:** If either the key does not exist OR it has not been successfully validated in the last 24 hours, the **API Key Setup Flow** must be initiated immediately. Otherwise, the application can proceed with its normal startup.

#### **Validation Logic**

To meet the "once per day at most" requirement, the following logic must be used:

* **Timestamping:** When an API key is successfully validated, the current timestamp **MUST** be stored in `localStorage` under the key `ape-api-key-last-validated`.
* **Test Call:** The validation itself consists of making a `POST` call with the user's API key.
  * **Endpoint:** `https://api.wearables-ape.io/models/v1/chat/completions`
  * **Payload:**

```json
{
  "model": "gpt-4o",
  "messages": [{"role": "user", "content": "test"}],
  "max_tokens": 5
}
```

* **Failure Handling:** If a scheduled daily validation call fails, the `ape-api-key` and `ape-api-key-last-validated` values **MUST** be cleared from `localStorage`, and the **API Key Setup Flow** must be triggered.

#### **API Key Setup Flow (Popup)**

This flow is initiated when the initial key validation fails. A modal popup with all the content below fitting without need for scrolling down, styled consistently with the rest of the application, **MUST** be displayed and follow these steps:

1. **Inform the User:** Display the following information on the popup, in the following order:
   * **Title**: “One-Time Setup Required to Enjoy Vibe Coded Prototypes”
   * **Explanation below the title**: “As required by Meta guidelines, every user needs to go through this one-time flow, which should be required only once for all prototypes created through the [Vibe Coding @ Meta (XFN-Friendly)](http://fburl.com/vibe-code) Workshop”
   * **Important Notes section:**
     1. “An API key is essentially a way for meta servers to know that you are the one using the prototype, and this is required to enable the functionalities used in this prototype, such as meta-hosted LLMs to process the prototype logic.”
     2. “The URL provided below is an internal, Meta-only service approved for company-wide use, regardless of your organization or function.”
2. **Provide Instructions:** Display clear, step-by-step instructions for the user in a bullet list (not numbered list):
   * *Step 0: If never done before, go to [https://wearables-ape.io/consent](https://wearables-ape.io/consent) and sign the consent form*
   * **Step 1:** Go to [https://wearables-ape.io/settings/api-keys](https://wearables-ape.io/settings/api-keys)
   * **Step 2:** Press the “New API Key” button, and copy the API key *(long string of letters/numbers)*
   * **Step 3:** Paste your new API key into the field below and click "Save".
3. **Capture and Validate Input:** Provide a plain text input field (not password field) and a "Save" button.
   * When the "Save" button is clicked, the value from the input field **MUST** be used to perform the specific **Test Call** defined in the "Validation Logic" section. Make sure required event listeners and button logic is properly implemented to prevent cases of button clicks making no actions.
4. **Handle Success and Failure:**
   * **On Successful Validation:**
     1. Save the validated key to `localStorage` under the key `ape-api-key`.
     2. Save the current timestamp to `localStorage` under `ape-api-key-last-validated`.
     3. Display a clear success message to the user (e.g., "Success\! Your API key has been saved.").
     4. Automatically reload the page after a 1-2 second delay to re-initialize the app.
   * **On Failed Validation:**
     1. Display a clear error message (e.g., "Invalid API Key. Please check your key and try again.").
     2. The popup **MUST** remain open, allowing the user to correct the key and try again.

---

## **2\. API Usage**

### **2.1. Rate Limiting**

* **Constraint:** All API calls to any endpoint under [https://api.wearables-ape.io](https://api.wearables-ape.io) are **rate limited to 1 call per second per model** *(i.e. gpt-4o and gpt-4o-mini have separate and independent rate limits).*
* **Important:** The rate limiting applies from **API call to API call** - there is **no need to wait for the response** before the 1-second interval begins. This allows you to parallelize API calls to the same model with 1-second intervals between each call initiation.
* **Implementation Strategy:** You can implement a global queue that manages these 1-second intervals, allowing you to fully parallelize calls to multiple models in this app. For example:
  * Calls to `gpt-4o` can be made every 1 second (without waiting for responses)
  * Simultaneously, calls to `gpt-4o-mini` can be made every 1 second (independent queue)
  * Simultaneously, calls to `gpt-5` can be made every 1 second (independent queue)
* You must ensure your code respects the 1-second interval between initiating calls to the same model to avoid errors.

### **2.2. LLM Logic**

* **Endpoint:** You MUST use the following endpoint for all chat completions, overriding the default OpenAI Chat Completion endpoint URL: `https://api.wearables-ape.io/models/v1/chat/completions`

#### API instructions per use case

Here are the specifications with the requested heading structure.

---

##### **1\. Text-Only Query**

This is the standard request for all text-based logic, such as answering questions, writing code, or summarizing text.

###### **Standard Models (GPT-4o, GPT-4o-mini)**

Use these models for general text-based queries where speed is important.

**API Payload (Request)**

The payload is a JSON object sent to the specified endpoint. The content field is a simple string.

```

curl -X POST https://api.wearables-ape.io/models/v1/chat/completions \
-H "Authorization: Bearer $YOUR_API_KEY" \
-H "Content-Type: application/json" \
-d '{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Explain the three laws of thermodynamics in simple terms."
    }
  ],
  "max_tokens": 2000
}'

```

**Key Parameters:**

* **model**: gpt-4o or gpt-4o-mini.
* **messages**: An array of message objects. For text-only, the content is a string.
* **max\_tokens**: Must be higher than 2000

**Expected Response Structure**

The response is a standard chat completion JSON object. The assistant's reply is in choices\[0\].message.content.

```

{
  "id": "chatcmpl-123456789abcdefg",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-4o-mini",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Here are the three laws of thermodynamics, simplified:\n\n1.  **You can't win (Conservation of Energy):** Energy can't be created or destroyed, only changed from one form to another. \n2.  **You can't break even (Entropy):** Things naturally tend to get more messy and disordered over time (entropy increases).\n3.  **You can't quit the game (Absolute Zero):** You can never reach absolute zero (the coldest possible temperature), where all particle motion stops."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 30,
    "completion_tokens": 105,
    "total_tokens": 135
  }
}

```

---

###### **GPT-5 with Reasoning (For Complex Reasoning Tasks Only)**

⚠️ **IMPORTANT**: GPT-5 should ONLY be used for tasks that require advanced reasoning capabilities and justify the significant extra latency compared to GPT-4o models. This model is designed specifically for reasoning-intensive tasks, not general queries.

**When to Use GPT-5 Reasoning:**

GPT-5 is appropriate for:
* Complex mathematical problems requiring multi-step reasoning
* Advanced coding challenges with intricate logic
* Scientific analysis requiring deep theoretical understanding
* Multi-step problem solving with dependencies
* Tasks requiring chain-of-thought reasoning, including with long context data needed for high quality output.
* Complex data analysis requiring inference

**When NOT to Use GPT-5:**

Do NOT use GPT-5 for:
* Simple questions or basic information retrieval
* General conversation or chatbot interactions
* Basic code generation or simple debugging
* Standard text summarization or rewriting
* Any task where speed is prioritized over deep reasoning

**API Payload (Request)**

```

curl -X POST https://api.wearables-ape.io/models/v1/chat/completions \
-H "Authorization: Bearer $YOUR_API_KEY" \
-H "Content-Type: application/json" \
-d '{
  "model": "gpt-5",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Solve this complex optimization problem with detailed reasoning..."
    }
  ],
  "max_completion_tokens": 128000,
  "temperature": 1,
  "reasoning_effort": "medium"
}'

```

**Key Parameters:**

* **model**: Must be "gpt-5" for reasoning capabilities
* **max_completion_tokens**: Set to 128000 (DO NOT use "max_tokens" for GPT-5)
* **temperature**: MUST be set to 1 (required for reasoning models)
* **reasoning_effort**: Controls the depth of reasoning (see guidance below)
* **messages**: An array of message objects with text content

**Reasoning Effort Levels:**

The `reasoning_effort` parameter controls how much internal reasoning the model performs before generating its final answer. Choose based on task complexity:

1. **"minimal"** - Fastest responses, minimal reasoning overhead
   * Use for: Problems that need some reasoning but have straightforward solutions
   * Latency: Lowest (closest to GPT-4o speed)
   * Quality: Basic reasoning capability
   * Example use cases: Simple math word problems, basic logical deductions

2. **"low"** - Light reasoning for moderately complex tasks (DEFAULT, recommended starting point)
   * Use for: Tasks with some complexity but limited steps
   * Latency: Low to moderate
   * Quality: Handles tasks with 2-3 reasoning steps
   * Example use cases: Basic algorithm design, simple code optimization, multi-step mathematical problems, moderate coding challenges, analysis requiring inference

**Best Practices:**
* Start with "low" and adjust based on results
* Use "minimal" when you need reasoning but want faster responses
* Consider whether GPT-4o might suffice before choosing GPT-5

**Expected Response Structure**

GPT-5 responses can include reasoning content. The model may return reasoning steps separately from the final answer:

**Option 1: String Format (Simple Response)**

```json
{
  "id": "chatcmpl-gpt5-abc123",
  "object": "chat.completion",
  "created": 1677652488,
  "model": "gpt-5",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Based on the analysis, the answer is 42."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 50,
    "completion_tokens": 150,
    "total_tokens": 200
  }
}
```

**Option 2: Array Format (With Reasoning)**

```json
{
  "id": "chatcmpl-gpt5-xyz789",
  "object": "chat.completion",
  "created": 1677652588,
  "model": "gpt-5",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": [
          {
            "type": "reasoning",
            "reasoning": "First, I need to break down the problem into steps. Step 1: Identify the key variables. Step 2: Apply the formula..."
          },
          {
            "type": "text",
            "text": "Based on the analysis, the answer is 42."
          }
        ]
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 50,
    "completion_tokens": 150,
    "total_tokens": 200
  }
}
```

**Handling GPT-5 Responses:**

Your code must handle both response formats:

1. Check if `message.content` is a string or array
2. If array, look for objects with `type: "reasoning"` and `type: "text"`
3. Extract reasoning content separately to display the model's thought process
4. Extract text content for the final answer

**Example JavaScript Response Handling:**

```javascript
const choice = data.choices[0];
let assistantMessage = '';
let reasoningText = '';

if (typeof choice.message.content === 'string') {
  assistantMessage = choice.message.content;
} else if (Array.isArray(choice.message.content)) {
  for (const part of choice.message.content) {
    if (part.type === 'reasoning') {
      reasoningText = part.reasoning || '';
    } else if (part.type === 'text') {
      assistantMessage = part.text || '';
    }
  }
}

// Display reasoningText separately to show the model's thought process
// Display assistantMessage as the final answer
```

---

##### **2\. Text and Document Query**

Follow the “text-only query” instructions for the endpoint to use and it’s parameters, and follow the following rules for handing documents:

######

###### **Core Rules**

1. No "File Attachments". The /v1/chat/completions endpoint does not support file uploads or attachments. You cannot send a file object or reference a file ID (which is a feature of the Assistants API).
2. "In-Context" Content Only. The only way to have the model "read" a file is to read its contents in your application and paste the entire text content of the file directly into the content field of a user or system message.
3. Client-Side Responsibility. Your application, not the API, is responsible for all file handling before the API call. This includes:
   * Providing a UI for the user to select a file (e.g., \<input type="file"\>).
   * Using a client-side reader (like FileReader in JavaScript) to read the file's content into a string.
   * Constructing the API request payload by injecting this string into the prompt.
4. Prompt Formatting is Critical
   To avoid confusing the model, you must use clear delimiters to separate the user's query from the file's raw content. Use Markdown code blocks or boundary markers.
   **Good Example:**
   JSON

````

{
  "role": "user",
  "content": "What is the average age in this CSV data? \n\n```csv\nUserID,Name,Age\n1,Alice,28\n2,Bob,34\n```"
}
````

**Bad Example:**

JSON

```
{
  "role": "user",
  "content": "What is the average age in this CSV data? UserID,Name,Age\n1,Alice,28\n2,Bob,34"
}
```

---

###### **Handling Specific File Types**

* **.txt Files:** Inject the raw text content. Using delimiters like \---START OF FILE--- and \---END OF FILE--- is recommended.
* **.json Files:** Inject the JSON string inside a \`\`\`json ... \`\`\` Markdown block. This helps the model correctly parse its structure.
* **.csv Files:** Inject the CSV data inside a \`\`\`csv ... \`\`\` Markdown block. This helps the model identify the header and rows.
* **Binary Files (.pdf, .docx, etc.)**: This endpoint cannot process binary files. You must first use a separate, third-party library to extract the text content from these files *before* sending it to the API.

---

###### **Limitations and Constraints**

1. Token Limits are the Hard Constraint
   This method is strictly limited by the model's maximum context window (e.g., gpt-4o has 128,000 tokens). The user's query plus the entire file content plus the model's response must all fit within this limit.
2. Handling Large Files
   If a file's content exceeds the token limit, the API call will fail. Your application must handle this:
   * **Recommended:** Check the file's size or approximate token count *before* reading the file. If it is too large, inform the user with an error (e.g., "File is too large. Please upload a smaller file or copy/paste a selection.").
   * **Advanced:** Implement "chunking." This involves programmatically splitting the large file into smaller text chunks that fit the token limit and sending them in a series of API calls. This is a complex workflow that you must design and manage.

---

##### **3\. Text and Image Query**

This is for all image analysis use cases (Object Detection, OCR, Visual Q\&A, etc.). The payload structure requires the content to be an array containing text and image URLs (which can be a public URL or a Base64 data URI).

###### **API Payload (Request)**

```

curl -X POST https://api.wearables-ape.io/models/v1/chat/completions \
-H "Authorization: Bearer $YOUR_API_KEY" \
-H "Content-Type: application/json" \
-d '{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "How many people are in this photo, and what color is the car in the foreground?"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "https://example.com/images/street-scene.jpg",
            "detail": "high"
          }
        }
      ]
    }
  ],
  "max_tokens": 2000
}'

```

**Key Parameters:**

* **model**: gpt-4o or gpt-4o-mini.
* **content**: An array containing text and image(s).
* **type: "image\_url"**: The object containing the image.
* **image\_url.url**: A public URL (e.g., https://...) or a Base64 data URI (data:image/png;base64,...).
* **image\_url.detail**: Must be set to **high**
* **max\_tokens**: Must be higher than 2000

###### **Expected Response Structure**

The response will contain the answer to your visual question.

```

{
  "id": "chatcmpl-123456789qrstuvw",
  "object": "chat.completion",
  "created": 1677652488,
  "model": "gpt-4o",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "There are 3 people visible in the photo. The car in the foreground is red."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 845,
    "completion_tokens": 19,
    "total_tokens": 864
  }
}

```

##### 4\. Any other use case

Apply your logic and look up the latest OpenAI chat completion API documentation to understand how to structure the payload.

### **2.3. Audio Transcription (Whisper)**

To transcribe audio, use the following API specifications:

* **Method:** POST
* **Endpoint:** [https://api.wearables-ape.io/models/v1/audio/transcriptions](https://api.wearables-ape.io/models/v1/audio/transcriptions)
* **Headers:**
  * accept: application/json
  * Content-Type: multipart/form-data
  * Authorization: Bearer \<ape-api-key from local storage\>
* **Form Data:**
  * model: whisper
  * language: en
  * file: The audio file (e.g., \<FILE\>.mp3;type=audio/mpeg)
* **Constraint:** The file MUST be sent as multipart/form-data, not as a base64 encoded blob.

**Example cURL:**

```shell
curl -X 'POST' \
  'https://api.wearables-ape.io/models/v1/audio/transcriptions' \
  -H 'accept: application/json' \
  -H 'Content-Type: multipart/form-data' \
  -H 'Authorization: Bearer TOKEN' \
  -F 'model=whisper' \
  -F 'language=en' \
  -F 'file=@<FILE>.mp3;type=audio/mpeg'
```

### **2.4. Image Generation (nano-banana)**

Image generation is a two-step process. **Note:** Generated images expire after 30 days.

#### **Step 1: Request Image Generation**

* **Endpoint:** [https://api.wearables-ape.io/conversations?sync=true](https://api.wearables-ape.io/conversations?sync=true)
* **API Key:** Use the ape-api-key from local storage.
* **Payload (JSON):**
  * model\_api\_name: "nano-banana"
  * name: "llm-image-gen"
  * output\_type: "file\_id"
  * user: "\<user prompt\>"
* **Image Input (Optional):** If the user provides an input image, send it as a base64 string in the attachment field:
  * attachment: "data:image/jpeg;base64,..."

Example Response:

You will receive a JSON object containing a file\_id.

```json
{
  "cid": "conv:00ub3bnp6fWZ6R2JB357-ae3a144f-d51e-4358-b74c-37ce7c09900c",
  "result": {
    "base64": null,
    "file_id": [
      "913ef030-9c81-4428-aaee-57b7d245f329.png"
    ],
    "temp_url": null
  }
}
```

#### **Step 2: Retrieve Generated Image**

Use the file\_id from the Step 1 response to fetch the image.

* **Method:** GET
* **Endpoint:** \<[https://api.wearables-ape.io/files/\\](https://api.wearables-ape.io/files/\\)\<file\_id\>?file\_type=web\_generated\> (Replace \<file\_id\> with the ID from the response).
* **Headers:**
  * accept: application/json
  * Authorization: Bearer \<ape-api-key from local storage\>

**Example cURL:**

```shell
curl -X 'GET' \
  'https://api.wearables-ape.io/files/913ef030-9c81-4428-aaee-57b7d245f329.png?file_type=web_generated' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <ape-api-key from local storage>'
```

###

### **2.5. Cloud Storage of JSONs (Structured Memories)**

This API allows you to store and retrieve arbitrary JSON data associated with the user's account. Records are unique per user based on their API key, so an API call to retrieve the stored memory for a specific \<recordID\> will return different values based on the identity of the user making the API call (identified by the endpoint using their API Key).

* **Endpoint:** `<https://api.wearables-ape.io/structured-meries/><recordID>`
  * `<recordID>`: A unique string identifier without spaces. See the key naming convention below.
* **Authorization:** Requires the `Authorization: Bearer <ape-api-key>` header.
* **Methods:**
  * **GET**: Retrieves the JSON object stored with the given `<recordID>`.
  * **PUT**: Updates or creates the JSON object for the given `<recordID>`. The body of the request should be the JSON data you want to store.

    #### **Key Naming Convention (`<recordID>`)**

To ensure clarity and avoid conflicts, keys should follow a specific naming logic:

1. **Prefix:** Start with the application's name. Replace any spaces in the app name with dashes (`-`) or underscores (`_`).
2. **Separator:** Use a dash (`-`) or underscore (`_`) to separate the app name prefix from the specific data field name.
3. **Field Name:** Add the name of the data field you are storing (e.g., `past_prompts`, `user_settings`).

**Example:**

* **App Name:** `QA prompt generator`
* **Field to Store:** Past prompts generated by the user
* **Resulting `<recordID>`:** `qa_prompt_generator-past_prompts`

This app name prefix (`qa_prompt_generator`) must stay unique and should be captured in the `readme.md` file of the project for documentation.

**Example GET Response (for recordID="rl\_terminal\_buddy-commands"):**

```json
{
  "created_at": "2025-10-17T05:45:37.635000",
  "updated_at": "2025-10-17T05:45:37.635000",
  "stored_type": null,
  "value": {
    "commands": [
      {
        "name": "SSH Connect",
        "color": "cyan",
        "command": "ssh @",
        "isStarred": true,
        "sectionId": "connection",
        "variables": [
          {
            "name": "username",
            "label": "Username"
          },
          {
            "name": "ip_address",
            "label": "IP Address"
          }
        ],
        "description": "Connect to device via SSH"
      },
      {
        "name": "Check Device Status",
        "color": "green",
        "command": "adb devices",
        "sectionId": "troubleshooting",
        "description": "List connected Android devices"
      },
      {
        "name": "Deploy Application",
        "color": "magenta",
        "command": "adb push  /data/local/tmp/",
        "isStarred": false,
        "sectionId": "custom-deployment",
        "variables": [
          {
            "name": "app_path",
            "label": "Application Path"
          }
        ],
        "description": "Deploy application to device"
      }
    ]
  },
  "shared_with_ids": [],
  "id": "rl_terminal_buddy-commands",
  "owner_id": "00ub3bnp6fWZ6R2JB357"
}
```

---

### **2.6. Cloud Storage of Files**

This API allows you to upload and retrieve files (images, documents, etc.) associated with the user's account. Files are stored temporarily for **30 days** and then automatically deleted.

**⚠️ Important Note:** Files are saved only for 30 days.

#### **Upload File**

Upload a file to cloud storage and receive a unique file ID for later retrieval.

* **Method:** POST
* **Endpoint:** `https://api.wearables-ape.io/files/`
* **Headers:**
  * `accept: application/json`
  * `Content-Type: multipart/form-data`
  * `Authorization: Bearer <ape-api-key from local storage>`
* **Form Data:**
  * `file`: The file to upload (e.g., `@photo.jpeg;type=image/jpeg`)

**Example cURL:**

```shell
curl -X 'POST' \
  'https://api.wearables-ape.io/files/' \
  -H 'accept: application/json' \
  -H 'Content-Type: multipart/form-data' \
  -H 'Authorization: Bearer c957d869-2fb4-427c-bfe6-72ac70ced836' \
  -F 'file=@photo-4223_singular_display_fullPicture.jpeg;type=image/jpeg'
```

**Example Response:**

```json
{
  "success": "photo-4223_singular_display_fullPicture.jpeg uploaded successfully.",
  "file_id": "c7d3172a-7822-4c0a-95f5-fe25b2911530.jpeg"
}
```

**Key Response Fields:**

* `success`: Confirmation message with the original filename
* `file_id`: Unique identifier to retrieve the file later (format: UUID.extension)

---

#### **Download/Retrieve File**

Retrieve a previously uploaded file using its file ID.

* **Method:** GET
* **Endpoint:** `https://api.wearables-ape.io/files/<file_id>?file_type=default`
  * `<file_id>`: The unique file ID returned from the upload response
  * `file_type=default`: Query parameter specifying the file type category
* **Headers:**
  * `accept: application/json`
  * `Authorization: Bearer <ape-api-key from local storage>`

**Example cURL:**

```shell
curl -X 'GET' \
  'https://api.wearables-ape.io/files/c7d3172a-7822-4c0a-95f5-fe25b2911530.jpeg?file_type=default' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer c957d869-2fb4-427c-bfe6-72ac70ced836'
```

**Response:**

The endpoint returns the raw file content as a binary blob with appropriate content-type headers, allowing the browser to handle it natively (display images, download documents, etc.).

**Response Details:**

* **HTTP Status Code:** `200` (on success)
* **Response Format:** Binary blob (raw file content)
* **Content-Type Header:** Dynamically set based on file type
  * For CSV files: `text/csv; charset=utf-8`
  * For JPEG images: `image/jpeg`
  * For PNG images: `image/png`
  * For other file types: Appropriate MIME type based on file extension

**Response Structure by File Type:**

1. **Document Files (CSV, TXT, etc.):**
   * Content-Type: `text/csv; charset=utf-8` or similar
   * Blob contains the raw text content
   * Can be read as text using blob.text()
   * Suitable for downloading or client-side processing

2. **Image Files (JPEG, PNG, etc.):**
   * Content-Type: `image/jpeg`, `image/png`, etc.
   * Blob contains the raw binary image data
   * Can be displayed directly using URL.createObjectURL()
   * Suitable for image preview or download

**Example Response Handling in JavaScript:**

```javascript
// Make the GET request
const response = await fetch(
  `https://api.wearables-ape.io/files/${fileId}?file_type=default`,
  {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
  }
);

if (response.ok) {
  const blob = await response.blob();
  const contentType = response.headers.get('content-type');

  console.log('Response status:', response.status); // 200
  console.log('Content-Type:', contentType); // e.g., "image/jpeg" or "text/csv; charset=utf-8"
  console.log('Blob size:', blob.size); // File size in bytes

  // For images - display preview
  if (contentType.startsWith('image/')) {
    const imageUrl = URL.createObjectURL(blob);
    imageElement.src = imageUrl;
  }

  // For documents - provide download link
  else {
    const downloadUrl = URL.createObjectURL(blob);
    downloadLink.href = downloadUrl;
    downloadLink.download = originalFileName;
  }
}
```

**Console Log Examples from Actual API Calls:**

*CSV File Download:*
```
Download response status: 200
Download response ok: true
Response content-type: text/csv; charset=utf-8
File content type: text/csv; charset=utf-8
Downloaded blob size: 10293 bytes
```

*JPEG Image Download:*
```
Download response status: 200
Download response ok: true
Response content-type: image/jpeg
File content type: image/jpeg
Downloaded blob size: 1777911 bytes
```

---

#### **Use Cases**

* Temporarily storing user-uploaded files (images, documents, PDFs, etc.)
* Sharing files between different sessions or components of the application
* Caching processed or generated files that don't need permanent storage
* Providing temporary file URLs for display or download

---

#### **Best Practices**

1. **Always inform users** that files are stored for only 30 days
2. **Store the file_id** in your application state or localStorage if you need to retrieve the file later
3. **Handle upload errors gracefully** with user-friendly error messages
4. **Validate file types and sizes** on the client side before uploading to improve user experience
5. **Consider the 30-day expiration** when designing your application's file management strategy

---

## **3\. Development Standards**

### **3.1. Technical Constraints**

* **Stack:** The application must be a standard HTML, CSS, and JavaScript web app capable of being run locally.
* **Environment:** The app will be run on a Macbook using the latest version of Google Chrome.
* **Network:** Any network-accessible resource or API may be used.

### **3.2. Media Handling**

* **Priority Rule:** If you are provided with specific media URLs (e.g., from user prompts or existing Figma/React code using Unsplash), you **MUST** use those exact URLs. Do not substitute them.
* **Fallback Rule:** For any other image needs where a URL is *not* provided, you **MUST** use the [https://picsum.photos/](https://picsum.photos/) service.
  * **Square Image:** \<[https://picsum.photos/\\](https://picsum.photos/\\)\<size\>\> (e.g., [https://picsum.photos/400](https://picsum.photos/400))
  * **Rectangular Image:** \<[https://picsum.photos/\\](https://picsum.photos/\\)\<width\>/\<height\>\> (e.g., [https://picsum.photos/400/250](https://picsum.photos/400/250))
  * **Cache Busting:** To ensure a new image is fetched, append a random parameter (e.g., [https://picsum.photos/400?random=1](https://picsum.photos/400?random=1)).

### **3.3. Analytics**

You must integrate Google Analytics using the following Tag ID:

* **Tag ID:** G-Q98010P7LZ

### **3.4. Debuggability**

* The application must be highly debuggable.
* You **MUST** add extensive console.log() statements for every significant step, including:
  * Application loading
  * All user flow steps
  * Key logic execution
  * API call initiation and reception (success or failure)
  * Full REST API calls, including endpoint and full payload
  * Full response from API Calls

### **3.5. Documentation**

* A fully detailed README.md file must be created and maintained.
* The README.md must include a section titled **"Original Prompt"**.
* This section must contain the *full, unedited text* of the original prompt that initiated the project.
* The README.md **MUST** have the following string present at the bottom of the file: "Protohub fullscreen deployment: true"
* Every time you make changes to the code, you must reflect those changes in the README.me file to keep it updated

### **3.6. Security & Privacy**

* This application is intended for internal use only.
* It will be run in a secure environment, either:
  1. Locally on a secure company laptop.
  2. As a GitHub Page within a GitHub Enterprise environment, accessible only to company employees on a secure network.

---

## **4\. Execution Methodology**

### **4.1. The tasks.md Operating Model**

This project follows a structured, task-based execution methodology using a `tasks.md` file as the single source of truth for all development activities. This approach ensures transparency, traceability, and systematic progress tracking.

#### **Core Principles**

1. **Receive the Brief**
   * The user provides a complete, extensive brief covering all application requirements
   * The brief may include functional specifications, design requirements, API integrations, and user flows

2. **Create the Master Plan**
   * **CRITICAL FIRST STEP:** Before writing any code, generate a comprehensive `tasks.md` file
   * This file serves as the master execution plan, breaking down the entire brief into a detailed, step-by-step roadmap
   * The plan should outline all tasks required to build the first testable version of the application
   * Tasks should be:
     * Specific and actionable
     * Organized in logical sequence
     * Grouped by feature or component where appropriate
     * Marked with checkboxes for completion tracking

3. **Strict Task-Based Execution**
   * **MANDATORY RULE:** Only work on tasks that are explicitly listed in the `tasks.md` file
   * No code should be written or changes made unless they correspond to a task in the file
   * Follow the plan logically, executing tasks in the order that makes technical sense

#### **The "Update-Execute-Complete" Loop**

This is the fundamental workflow cycle that must be followed for all development work:

1. **If User Makes a New Request:**
   * First, update the `tasks.md` file to add the new request as one or more tasks
   * Mark these tasks as pending `[ ]`
   * Only after updating the task list should you proceed to execution

2. **Execute:**
   * Work on the task(s), writing code, making changes, or performing the required actions
   * Follow all coding standards and best practices defined in this rules document
   * Add comprehensive console.log statements for debuggability

3. **Update and Complete:**
   * **MANDATORY:** Every response that involves work completion must conclude with:
     * The complete, updated content of the `tasks.md` file
     * Tasks that are completed marked with `[x]`
     * Any new tasks discovered during execution added to the list
   * This ensures the task list always reflects the current project state

#### **Maintaining the Single Source of Truth**

The `tasks.md` file is the authoritative record of project progress. This means:

* **Always Current:** The file must be updated in real-time as work progresses
* **Complete History:** Completed tasks remain in the file (marked `[x]`) to provide a record of what was accomplished
* **User Visibility:** The user can save and reference this file at any time to understand project status
* **No Surprises:** All planned work is visible before execution begins

#### **Handling Context Resets**

When a session is interrupted or reset:

1. **Read the Current State:**
   * Request the latest `tasks.md` content from the user
   * Review all completed tasks `[x]` to understand what has been done
   * Review all pending tasks `[ ]` to understand what remains

2. **Resume Work:**
   * Pick up exactly where the previous session left off
   * Work on the next logical pending task in the sequence
   * Continue following the "Update-Execute-Complete" loop

#### **Example tasks.md Structure**

```markdown
# Project Tasks

## Setup and Configuration
- [x] Initialize project structure
- [x] Set up API key validation flow
- [x] Implement localStorage management for API keys

## Core Features
- [x] Create main chat interface
- [ ] Implement file upload functionality
- [ ] Add image analysis support
- [ ] Build GPT-5 reasoning integration

## Styling and UX
- [ ] Apply responsive design
- [ ] Add loading states and error handling
- [ ] Implement dark mode toggle

## Testing and Deployment
- [ ] Test all API integrations
- [ ] Verify error handling
- [ ] Update README.md with final documentation
```

#### **Benefits of This Methodology**

* **Transparency:** User always knows what's being worked on and what's planned
* **Accountability:** Clear record of completed vs. pending work
* **Efficiency:** Prevents scope creep and unnecessary work
* **Collaboration:** Easy for user to modify priorities by updating the task list
* **Context Resilience:** Sessions can be paused and resumed without losing progress
* **Quality:** Systematic approach ensures nothing is forgotten or overlooked
