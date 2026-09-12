import 'dotenv/config'
import z from 'zod'


const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().positive().default(4000),
    DATABASE_URL: z.string().min(1),
    WEB_ORIGIN: z.string().url().default('http://localhost:3000')
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
    console.error("Invalid environment variables: ");
    console.error(result.error.flatten().fieldErrors)

    process.exit(1)
}

export const env = result.data;