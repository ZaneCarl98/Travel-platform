import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { isAuthenticated, createPost } from '@/services/api';

const CreatePost = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const [title, setTitle] = useState('');
  const [cityName, setCityName] = useState('');
  const [content, setContent] = useState('');
  const [totalDays, setTotalDays] = useState(1);
  const [routeStops, setRouteStops] = useState<string[]>(['']);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addRouteStop = () => {
    setRouteStops([...routeStops, '']);
  };

  const updateRouteStop = (index: number, value: string) => {
    const updated = [...routeStops];
    updated[index] = value;
    setRouteStops(updated);
  };

  const removeRouteStop = (index: number) => {
    if (routeStops.length <= 1) return;
    setRouteStops(routeStops.filter((_, i) => i !== index));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setImages((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!title.trim() || !cityName.trim() || !content.trim()) {
      alert('Please fill in title, city and content.');
      return;
    }

    const cleanedRouteStops = routeStops.map((stop) => stop.trim()).filter(Boolean);
    const routeText = cleanedRouteStops.join(' → ');

    setIsSubmitting(true);

    try {
      const createdPost = await createPost({
        title: title.trim(),
        city_name: cityName.trim(),
        content: content.trim(),
        route_text: routeText,
        route_stops: cleanedRouteStops,
        total_days: totalDays,
        images,
      });

      navigate(`/post/${createdPost.id}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to submit post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-16 z-40 border-b bg-card/90 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-3">
          <Button variant="outline" size="icon" onClick={handleGoBack} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">Post</h2>
          <Button
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className="rounded-full px-6"
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </div>

      <div className="container py-8">
        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter your post title..."
                className="text-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Journey Description</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write about your journey experience..."
                className="min-h-[240px] resize-y text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                placeholder="Click and enter the name of city"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Photos</Label>
              <div className="flex flex-wrap gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="group relative h-24 w-24 overflow-hidden rounded-lg border">
                    <img src={preview} alt={`Upload ${index + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute right-1 top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label={`Remove photo ${index + 1}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    aria-label="Upload photos"
                  />
                  <ImagePlus className="h-6 w-6" />
                </label>
              </div>
              <p className="text-sm text-muted-foreground">Click to add photos</p>
            </div>
          </div>

          <div className="lg:sticky lg:top-32 lg:self-start">
            <div className="rounded-xl border bg-card p-6">
              <h2 className="mb-2 text-xl font-bold">Route</h2>
              <div className="mb-4 flex items-center gap-2">
                <Label htmlFor="days" className="text-sm text-muted-foreground">Total time:</Label>
                <Input
                  id="days"
                  type="number"
                  min={1}
                  max={365}
                  value={totalDays}
                  onChange={(e) => setTotalDays(Number(e.target.value) || 1)}
                  className="w-16"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>

              <div className="space-y-3">
                {routeStops.map((stop, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {index + 1}
                    </div>
                    <Input
                      value={stop}
                      onChange={(e) => updateRouteStop(index, e.target.value)}
                      placeholder={`Site ${index + 1}`}
                      className="flex-1"
                    />
                    {routeStops.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRouteStop(index)}
                        aria-label={`Remove stop ${index + 1}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addRouteStop}
                className="mt-3 w-full"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Stop
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;