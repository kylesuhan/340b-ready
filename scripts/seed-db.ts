import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ModuleMeta {
  slug: string
  order_index: number
  title: string
  description: string
  difficulty: string
  is_free: boolean
  quiz_pass_threshold: number
}

interface LessonFile {
  order_index: number
  title: string
  content_md: string
  reading_time_minutes: number
}

async function seed() {
  console.log('🌱 Starting seed...')

  const modulesDir = path.join(process.cwd(), 'content', 'modules')
  const moduleDirs = fs.readdirSync(modulesDir).sort()

  for (const moduleDir of moduleDirs) {
    const modulePath = path.join(modulesDir, moduleDir)
    if (!fs.statSync(modulePath).isDirectory()) continue

    const meta: ModuleMeta = JSON.parse(
      fs.readFileSync(path.join(modulePath, 'meta.json'), 'utf-8')
    )

    console.log(`📦 Seeding module: ${meta.title}`)

    // Upsert module
    const { data: moduleRecord, error: moduleError } = await supabase
      .from('modules')
      .upsert(
        {
          slug: meta.slug,
          order_index: meta.order_index,
          title: meta.title,
          description: meta.description,
          difficulty: meta.difficulty,
          is_free: meta.is_free,
          quiz_pass_threshold: meta.quiz_pass_threshold,
          published: true,
        },
        { onConflict: 'slug' }
      )
      .select()
      .single()

    if (moduleError) {
      console.error(`Error seeding module ${meta.slug}:`, moduleError)
      continue
    }

    const moduleId = moduleRecord.id

    // Seed lessons from markdown files
    const lessonFiles = fs
      .readdirSync(modulePath)
      .filter((f) => f.startsWith('lesson-') && f.endsWith('.md'))
      .sort()

    for (const lessonFile of lessonFiles) {
      const lessonContent = fs.readFileSync(
        path.join(modulePath, lessonFile),
        'utf-8'
      )

      // Parse frontmatter (simple --- block)
      const fmMatch = lessonContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
      if (!fmMatch) {
        console.warn(`No frontmatter in ${lessonFile}`)
        continue
      }

      const fm: Record<string, string> = {}
      fmMatch[1].split('\n').forEach((line) => {
        const [key, ...rest] = line.split(':')
        if (key && rest.length) fm[key.trim()] = rest.join(':').trim()
      })

      const content_md = fmMatch[2].trim()
      const orderIndex = parseInt(fm.order_index ?? '1')

      const { error: lessonError } = await supabase
        .from('lessons')
        .upsert(
          {
            module_id: moduleId,
            order_index: orderIndex,
            title: fm.title ?? lessonFile,
            content_md,
            content_html: null,
            reading_time_minutes: parseInt(fm.reading_time ?? '5'),
            published: true,
          },
          { onConflict: 'module_id,order_index' }
        )

      if (lessonError) {
        console.error(`Error seeding lesson ${lessonFile}:`, lessonError)
      } else {
        console.log(`  ✅ Lesson: ${fm.title}`)
      }
    }

    // Seed quiz questions
    const questionsPath = path.join(modulePath, 'quiz-questions.json')
    if (fs.existsSync(questionsPath)) {
      const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'))

      for (const q of questions) {
        const { error: qError } = await supabase.from('quiz_questions').upsert(
          {
            module_id: moduleId,
            question_text: q.question_text,
            answers: q.answers,
            explanation: q.explanation ?? null,
            difficulty_tag: q.difficulty_tag ?? 'basic',
            active: true,
          },
          { onConflict: 'module_id,question_text' }
        )
        if (qError) console.error('Error seeding question:', qError.message)
      }
      console.log(`  ✅ ${questions.length} quiz questions`)
    }
  }

  console.log('✅ Seed complete!')
}

seed().catch(console.error)
