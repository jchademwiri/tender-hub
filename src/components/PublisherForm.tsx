"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building, Globe, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { Province, Publisher } from "@/db/schema";
import {
  type PublisherFormData,
  publisherDefaultValues,
  publisherFormSchema,
} from "@/lib/validations/publisher";

interface PublisherFormProps {
  publisher?: Publisher;
  provinces: Province[];
  action: (prevState: any, formData: FormData) => Promise<any>;
}

export default function PublisherForm({
  publisher,
  provinces,
  action,
}: PublisherFormProps) {
  const form = useForm<PublisherFormData>({
    resolver: zodResolver(publisherFormSchema),
    defaultValues: publisher
      ? {
          name: publisher.name,
          website: publisher.website || "",
          province_id: publisher.province_id,
        }
      : publisherDefaultValues,
  });

  const onSubmit = async (data: PublisherFormData) => {
    try {
      const formData = new FormData();
      formData.append("name", data.name.trim());
      formData.append("website", data.website?.trim() || "");
      formData.append("province_id", data.province_id);
      if (publisher?.id) formData.append("id", publisher.id);

      const result = await action({}, formData);

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(
          publisher
            ? "Publisher updated successfully"
            : "Publisher created successfully",
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(errorMessage);
    }
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
                  <InputGroupInput
                    placeholder="Enter publisher name"
                    {...field}
                  />
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
              <FormLabel>Website (Optional)</FormLabel>
              <FormControl>
                <InputGroup>
                  <InputGroupAddon>
                    <Globe className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    type="url"
                    placeholder="https://www.organization.gov.za"
                    {...field}
                  />
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
          {publisher ? "Update" : "Create"} Publisher
        </Button>
      </form>
    </Form>
  );
}
