import {
  FacebookIcon,
  LinkedInIcon,
  YouTubeIcon,
} from '@/components/shared/social-icons';

const socialLinks = [
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/in/hoda-nabeil-144094225/',
    icon: LinkedInIcon,
  },
  {
    name: 'YouTube',
    href: 'https://youtube.com/@ithracode?si=WnknLeBU6eilLa12',
    icon: YouTubeIcon,
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/hodanabeel.abuhashem/',
    icon: FacebookIcon,
  },
] as const;

export default function SocialLinks() {
  return (
    <nav>
      <ul className="flex items-center gap-2">
        {socialLinks.map((link) => (
          <li key={link.name}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex size-8 items-center justify-center text-foreground transition-colors hover:text-foreground/80"
              aria-label={link.name}
            >
              <link.icon className="size-5 shrink-0" />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
