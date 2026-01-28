import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const feedbackSchema = z.object({
  overall_rating: z.string().min(1, 'Please provide an answer').max(300, 'Maximum 300 characters'),
  ease_of_use: z.enum(['Very Easy', 'Easy', 'Neutral', 'Difficult', 'Very Difficult'], {
    required_error: 'Please select how easy it was to use'
  }),
  expectations_met: z.enum(['Exceeded', 'Met', 'Somewhat Met', 'Did Not Meet'], {
    required_error: 'Please select if we met your expectations'
  }),
  improvements: z.string().max(300, 'Maximum 300 characters').optional(),
  feature_requests: z.string().max(200, 'Maximum 200 characters').optional(),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

interface FeedbackFormProps {
  onSuccess: () => void;
}

export const FeedbackForm = ({ onSuccess }: FeedbackFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      overall_rating: '',
    },
  });

  const overallRatingValue = watch('overall_rating') || '';
  const improvementsValue = watch('improvements') || '';
  const featureRequestsValue = watch('feature_requests') || '';

  const onSubmit = async (data: FeedbackFormData) => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const feedbackData = {
        user_id: user?.id || null,
        user_email: user?.email || null,
        overall_rating: data.overall_rating.trim(),
        ease_of_use: data.ease_of_use,
        expectations_met: data.expectations_met,
        improvements: data.improvements?.trim() || null,
        feature_requests: data.feature_requests?.trim() || null,
      };

      const { error } = await supabase
        .from('user_feedback')
        .insert(feedbackData);

      if (error) throw error;

      toast({
        title: 'Thank you for your feedback! 🙏',
        description: 'Your input helps us improve PrivacyGuard.',
      });

      onSuccess();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Submission failed',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Question 1: Overall Rating */}
      <div className="space-y-3">
        <Label htmlFor="overall_rating" className="text-base">
          1. How often you feel to have something that actually helps to search our own digital data make sure it is safe? <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="overall_rating"
          placeholder="Share your thoughts about digital data search tools and safety..."
          {...register('overall_rating')}
          className="min-h-[100px] resize-none"
          maxLength={300}
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">Required</p>
          <p className="text-xs text-muted-foreground">
            {overallRatingValue.length}/300
          </p>
        </div>
        {errors.overall_rating && (
          <p className="text-sm text-destructive">{errors.overall_rating.message}</p>
        )}
      </div>

      <Separator />

      {/* Question 2: Ease of Use */}
      <div className="space-y-3">
        <Label className="text-base">
          2. How easy was it to use our system? <span className="text-destructive">*</span>
        </Label>
        <RadioGroup
          onValueChange={(value) => setValue('ease_of_use', value as any)}
          className="space-y-2"
        >
          {['Very Easy', 'Easy', 'Neutral', 'Difficult', 'Very Difficult'].map((option) => (
            <div key={option} className="flex items-center space-x-2">
              <RadioGroupItem value={option} id={`ease-${option}`} />
              <Label htmlFor={`ease-${option}`} className="font-normal cursor-pointer">
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
        {errors.ease_of_use && (
          <p className="text-sm text-destructive">{errors.ease_of_use.message}</p>
        )}
      </div>

      <Separator />

      {/* Question 3: Expectations Met */}
      <div className="space-y-3">
        <Label className="text-base">
          3. Did you find any useful results in this assessment? <span className="text-destructive">*</span>
        </Label>
        <RadioGroup
          onValueChange={(value) => setValue('expectations_met', value as any)}
          className="space-y-2"
        >
          {['Exceeded', 'Met', 'Somewhat Met', 'Did Not Meet'].map((option) => (
            <div key={option} className="flex items-center space-x-2">
              <RadioGroupItem value={option} id={`expectations-${option}`} />
              <Label htmlFor={`expectations-${option}`} className="font-normal cursor-pointer">
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
        {errors.expectations_met && (
          <p className="text-sm text-destructive">{errors.expectations_met.message}</p>
        )}
      </div>

      <Separator />

      {/* Question 4: Improvements */}
      <div className="space-y-3">
        <Label htmlFor="improvements" className="text-base">
          4. What could we improve?
        </Label>
        <Textarea
          id="improvements"
          placeholder="Your suggestions help us grow..."
          {...register('improvements')}
          className="min-h-[100px] resize-none"
          maxLength={300}
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">Optional</p>
          <p className="text-xs text-muted-foreground">
            {improvementsValue.length}/300
          </p>
        </div>
        {errors.improvements && (
          <p className="text-sm text-destructive">{errors.improvements.message}</p>
        )}
      </div>

      {/* Question 5: Feature Requests */}
      <div className="space-y-3">
        <Label htmlFor="feature_requests" className="text-base">
          5. Any specific features you'd like to see?
        </Label>
        <Textarea
          id="feature_requests"
          placeholder="Describe features you'd find valuable..."
          {...register('feature_requests')}
          className="min-h-[100px] resize-none"
          maxLength={200}
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">Optional</p>
          <p className="text-xs text-muted-foreground">
            {featureRequestsValue.length}/200
          </p>
        </div>
        {errors.feature_requests && (
          <p className="text-sm text-destructive">{errors.feature_requests.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit Feedback'
        )}
      </Button>
    </form>
  );
};
