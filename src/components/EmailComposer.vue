<template>
  <section class="container py-4">
    <h2 class="mb-3">Send Test Email</h2>

    <form @submit.prevent="handleSend" class="row g-3">
      <div class="col-md-6">
        <label class="form-label">To (email)</label>
        <input v-model.trim="to" type="email" class="form-control" required />
      </div>

      <div class="col-md-6">
        <label class="form-label">Subject</label>
        <input v-model.trim="subject" type="text" class="form-control" required />
      </div>

      <div class="col-12">
        <label class="form-label">Message (HTML allowed)</label>
        <textarea v-model="html" rows="4" class="form-control"
                  placeholder="<p>Hello!</p>"></textarea>
      </div>

      <div class="col-md-6">
        <label class="form-label">Attachment (optional)</label>
        <input ref="fileInput" type="file" class="form-control" @change="onPickFile" />
        <small v-if="fileName" class="text-muted">Selected: {{ fileName }}</small>
      </div>

      <div class="col-12">
        <button class="btn btn-custom" :disabled="loading">
          {{ loading ? 'Sending…' : 'Send Email' }}
        </button>
      </div>
    </form>

    <div v-if="status" class="alert mt-3"
         :class="status.ok ? 'alert-success' : 'alert-danger'">
      {{ status.message }}
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'


const FUNCTION_URL = 'https://sendemail-6rwlj53o6q-ts.a.run.app'

const to = ref('')
const subject = ref('')
const html = ref('<p>Hello from Youth Wellbeing Platform!</p>')
const fileInput = ref(null)

const fileName = ref('')
const attachment = ref(null) // { filename, type, content(base64) }

const loading = ref(false)
const status = ref(null)

function onPickFile (e) {
  status.value = null
  const file = e.target.files?.[0]
  if (!file) {
    attachment.value = null
    fileName.value = ''
    return
  }
  fileName.value = file.name

  const reader = new FileReader()
  reader.onload = () => {
    // result is a data URL like "data:application/pdf;base64,AAAA..."
    const base64 = String(reader.result).split(',')[1] // strip data URL prefix
    attachment.value = {
      filename: file.name,
      type: file.type || 'application/octet-stream',
      content: base64,
    }
  }
  reader.readAsDataURL(file)
}

async function handleSend () {
  status.value = null
  loading.value = true
  try {
    const payload = {
      to: to.value,
      subject: subject.value,
      html: html.value,
      attachment: attachment.value || undefined,
    }
    const resp = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await resp.json()
    if (resp.ok && data.ok) {
      status.value = { ok: true, message: 'Email sent successfully!' }
      // reset file input
      if (fileInput.value) fileInput.value.value = null
      fileName.value = ''
      attachment.value = null
    } else {
      status.value = { ok: false, message: data.error || 'Failed to send email' }
    }
  } catch (e) {
    status.value = { ok: false, message: 'Network or server error' }
  } finally {
    loading.value = false
  }
}
</script>
