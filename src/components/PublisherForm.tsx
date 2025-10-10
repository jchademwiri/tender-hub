'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Publisher, Province } from '@/db/schema';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Building, Globe, MapPin } from 'lucide-react';

const publisherSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  province_id: z.string().min(1, 'Province is required'),
});

type PublisherFormData = z.infer<typeof publisherSchema>;

interface PublisherFormProps {
  publisher?: Publisher;
  provinces: Province[];
  action: (prevState: any, formData: FormData) => Promise<any>;
}

export default function PublisherForm({ publisher, provinces, action }: PublisherFormProps) {
  const form = useForm<PublisherFormData>({
    resolver: zodResolver(publisherSchema),
    defaultValues: {
      name: publisher?.name || '',
      website: publisher?.website || '',
      province_id: publisher?.province_id || '',
    },
  });

  const onSubmit = async (data: PublisherFormData) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('website', data.website || '');
    formData.append('province_id', data.province_id);
    if (publisher?.id) formData.append('id', publisher.id);

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
                    <Building className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput placeholder="Enter publisher name" {...field} />
                </InputGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl>
                <InputGroup>
                  <InputGroupAddon>
                    <Globe className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput type="url" placeholder="https://example.com" {...field} />
                </InputGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="province_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <MapPin className="size-4" />
                Province
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a province" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {provinces.map((prov) => (
                    <SelectItem key={prov.id} value={prov.id}>
                      {prov.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Spinner className="mr-2" />}
          {publisher ? 'Update' : 'Create'} Publisher
        </Button>
      </form>
    </Form>
  );
}