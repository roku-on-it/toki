"use client";

import { FormEvent, useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { CurrentUserProfile } from "@/lib/types/user";
import { useSecretKeyUser } from "@/components/user/secret-key-gate";

const MAX_AVATAR_SIZE = 32 * 1024 * 1024; // 32 MB

type DisplayNameCardProps = {
  currentUser: CurrentUserProfile;
};

export function DisplayNameCard({ currentUser }: DisplayNameCardProps) {
  const [value, setValue] = useState(currentUser.displayName);
  const [avatar, setAvatar] = useState(currentUser.avatarBase64 ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const { refresh } = useSecretKeyUser();

  useEffect(() => {
    setValue(currentUser.displayName);
    setAvatar(currentUser.avatarBase64 ?? "");
  }, [currentUser.displayName, currentUser.avatarBase64]);

  const handleAvatarChange = (file: File | null) => {
    if (!file) {
      setAvatarError(null);
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError("Avatar must be smaller than 32 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatar(reader.result);
        setAvatarError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setError("Name is too short.");
      setMessage(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-secret-key": currentUser.secretKey,
        },
        body: JSON.stringify({ displayName: trimmed, avatarBase64: avatar }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Unable to update profile");
      }

      setMessage("Profile updated");
      setError(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Try uploading cute avatars :3</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-full border border-border/80 bg-muted">
              {avatar ? (
                <img
                  src={avatar}
                  alt={value || "avatar"}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="space-y-2 text-sm">
              <Label htmlFor="avatar-upload" className="font-medium">Avatar</Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={(event) => handleAvatarChange(event.target.files?.[0] ?? null)}
                disabled={isSubmitting}
              />
              {avatarError ? <p className="text-xs text-destructive">{avatarError}</p> : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setError(null);
                setMessage(null);
              }}
              maxLength={40}
              placeholder="e.g. Ryujin"
              disabled={isSubmitting}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
          <Button
            type="submit"
            disabled={isSubmitting || value.trim().length < 2 || !!avatarError}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
