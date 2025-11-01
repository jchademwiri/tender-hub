"use client";

import { ArrowLeft, ArrowRight, CheckCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatUserRole } from "@/lib/auth-utils-client";

interface OnboardingTourProps {
  userRole: string;
  userName: string;
  onComplete: () => void;
  onSkip: () => void;
}

interface TourStep {
  id: string;
  title: string;
  description: string;
  highlight?: string;
  action?: string;
}

const getTourSteps = (role: string, name: string): TourStep[] => {
  const baseSteps: TourStep[] = [
    {
      id: "welcome",
      title: `Welcome to Tender Hub, ${name}!`,
      description: `You've successfully joined as a ${formatUserRole(role).toLowerCase()}. Let's take a quick tour to help you get started.`,
      action: "Let's get started",
    },
    {
      id: "dashboard",
      title: "Your Dashboard",
      description:
        "This is your main dashboard where you'll find an overview of provinces and publishers in the system.",
      highlight: "dashboard-overview",
      action: "Next",
    },
    {
      id: "account",
      title: "Complete Your Account",
      description:
        "Update your account information to personalize your experience and ensure you have access to all features.",
      highlight: "account-setup",
      action: "Next",
    },
  ];

  // Role-specific steps
  const roleSpecificSteps: Record<string, TourStep[]> = {
    admin: [
      {
        id: "admin-invitations",
        title: "Manage Invitations",
        description:
          "As an administrator, you can invite new team members and manage their access levels.",
        highlight: "admin-invitations",
        action: "Next",
      },
      {
        id: "admin-team",
        title: "Team Management",
        description:
          "View and manage all team members, their roles, and permissions.",
        highlight: "admin-team",
        action: "Next",
      },
    ],
    manager: [
      {
        id: "manager-approvals",
        title: "Approval Requests",
        description:
          "Review and approve profile update requests from team members.",
        highlight: "manager-approvals",
        action: "Next",
      },
      {
        id: "manager-team",
        title: "Team Overview",
        description: "Monitor your team's activity and manage team members.",
        highlight: "manager-team",
        action: "Next",
      },
    ],
    user: [
      {
        id: "user-publishers",
        title: "Browse Publishers",
        description:
          "Explore and view information about publishers in different provinces.",
        highlight: "user-publishers",
        action: "Next",
      },
    ],
  };

  const finalSteps = [
    ...baseSteps,
    ...(roleSpecificSteps[role] || []),
    {
      id: "complete",
      title: "You're All Set!",
      description:
        "You've completed the onboarding tour. Feel free to explore the system and reach out if you need help.",
      action: "Get Started",
    },
  ];

  return finalSteps;
};

export function OnboardingTour({
  userRole,
  userName,
  onComplete,
  onSkip,
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const steps = getTourSteps(userRole, userName);
  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip();
  };

  // Highlight current step element
  useEffect(() => {
    if (currentStepData?.highlight) {
      const element = document.getElementById(currentStepData.highlight);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("ring-2", "ring-primary", "ring-offset-2");
        return () => {
          element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
        };
      }
    }
  }, [currentStepData]);

  if (!isVisible) return null;

  return (
    <Dialog open={isVisible} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              Step {currentStep + 1} of {steps.length}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogTitle className="text-left">
            {currentStepData.title}
          </DialogTitle>
          <DialogDescription className="text-left">
            {currentStepData.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tour
              </Button>
            )}
            <Button onClick={handleNext} className="flex items-center gap-2">
              {currentStepData.action}
              {!isLastStep && <ArrowRight className="h-4 w-4" />}
              {isLastStep && <CheckCircle className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
