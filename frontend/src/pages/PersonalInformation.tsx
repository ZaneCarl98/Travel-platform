import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { isAuthenticated, getCurrentUser, getUserProfile, updateProfile } from '@/services/api';

const PersonalInformation = () => {
  const navigate = useNavigate();
  const loggedIn = isAuthenticated();
  const currentUser = useMemo(() => getCurrentUser(), []);
  const userId = currentUser?.id;

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [mbti, setMbti] = useState('');
  const [constellation, setConstellation] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loggedIn || !userId) {
      navigate('/login');
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      try {
        const user = await getUserProfile(userId);
        if (cancelled) return;

        setDisplayName(user.display_name || '');
        setEmail(user.email || '');
        setBio(user.bio || '');
        setAge(user.age ? String(user.age) : '');
        setGender(user.gender || '');
        setMbti(user.mbti || '');
        setConstellation(user.constellation || '');
        setAvatarPreview(user.avatar_url || null);
      } catch {
        if (cancelled) return;

        setDisplayName(currentUser?.display_name || '');
        setEmail(currentUser?.email || '');
        setBio(currentUser?.bio || '');
        setAge(currentUser?.age ? String(currentUser.age) : '');
        setGender(currentUser?.gender || '');
        setMbti(currentUser?.mbti || '');
        setConstellation(currentUser?.constellation || '');
        setAvatarPreview(currentUser?.avatar_url || null);
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [loggedIn, userId, navigate]);

  if (!loggedIn || !userId) {
    return null;
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        display_name: displayName,
        bio,
        age: age ? Number(age) : undefined,
        gender,
        mbti,
        constellation,
        avatar: avatarFile || undefined,
      });
      alert('Profile updated successfully');
      navigate('/profile');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const constellations = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
  ];

  const mbtiTypes = [
    'ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP',
    'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
  ];

  return (
    <div className="min-h-screen">
      <div className="sticky top-16 z-40 border-b bg-card/90 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-3">
          <Button variant="outline" size="icon" onClick={() => navigate('/profile')} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">Personal Information</h2>
          <div className="w-10" />
        </div>
      </div>

      <div className="container py-8">
        <div className="mx-auto max-w-2xl space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} alt="Avatar" />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-2xl text-primary">
                    {displayName?.charAt(0) || '?'}
                  </AvatarFallback>
                )}
              </Avatar>
              <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  aria-label="Upload avatar"
                />
              </label>
            </div>
            <p className="text-sm text-muted-foreground">Click to update your avatar</p>
          </div>

          <div className="space-y-4 rounded-xl border bg-card p-6">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min={1}
                max={150}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Your age"
              />
            </div>

            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>MBTI</Label>
              <Select value={mbti} onValueChange={setMbti}>
                <SelectTrigger><SelectValue placeholder="Select MBTI" /></SelectTrigger>
                <SelectContent>
                  {mbtiTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Constellation</Label>
              <Select value={constellation} onValueChange={setConstellation}>
                <SelectTrigger><SelectValue placeholder="Select constellation" /></SelectTrigger>
                <SelectContent>
                  {constellations.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="w-full rounded-full" size="lg">
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'UPDATE'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PersonalInformation;