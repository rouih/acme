'use server';
import { sql } from '@vercel/postgres';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';


const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string()
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    const amountInCents = amount * 100;

    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    await sql`DELETE FROM invoices WHERE id= ${id}`;
    revalidatePath('/dashboard/invoices');
}

export async function createInvoice(formData: FormData) {
    // Parse the form data using the CreateInvoice schema to ensure it matches the expected structure
    // and to extract the customerId, amount, and status fields
    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status')
    });

    const amountInCets = amount * 100;

    // Get the current date in ISO format and extract only the date part (YYYY-MM-DD)
    const date = new Date().toISOString().split('T')[0];


    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCets}, ${status}, ${date})`;

    // Revalidate the path to ensure the dashboard/invoices page is up-to-date with the latest data (bcuz we updated the DB)
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}