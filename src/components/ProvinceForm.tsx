'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Province } from '@/db/schema';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { MapPin, Hash, FileText } from 'lucide-react';

const provinceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required').max(10, 'Code must be 10 characters or less'),
  description: z.string().optional(),
});

type ProvinceFormData = z.infer<typeof provinceSchema>;

interface ProvinceFormProps {
  province?: Province;
  action: (prevState: any, formData: FormData) => Promise<any>;
}

export default function ProvinceForm({ province, action }: ProvinceFormProps) {
  const form = useForm<ProvinceFormData>({
    resolver: zodResolver(provinceSchema),
    defaultValues: {
      name: province?.name || '',
      code: province?.code || '',
      description: province?.description || '',
    },
  });

  const onSubmit = async (data: ProvinceFormData) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('code', data.code);
    if (data.description) formData.append('description', data.description);
    if (province?.id) formData.append('id', province.id);

    await action({}, formData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <InputGroup>
                  <InputGroupAddon>
                    <MapPin className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput placeholder="Enter province name" {...field} />
                </InputGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <InputGroup>
                  <InputGroupAddon>
                    <Hash className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput placeholder="Enter province code" {...field} />
                </InputGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <InputGroup>
                  <InputGroupAddon>
                    <FileText className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput placeholder="Enter description (optional)" {...field} />
                </InputGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Spinner className="mr-2" />}
          {province ? 'Update' : 'Create'} Province
        </Button>
      </form>
    </Form>
  );
}