import { CONTACT_INFO } from '@/constants/contact';
import { MessageCircle } from 'lucide-react';

const ContactHeader = () => {
  return (
    <div className="text-center space-y-3">
      <h1 className=" lg:text-5xl md:text-4xl text-3xl font-bold text-foreground">
        تواصل معنا
      </h1>
      <p className="text-muted-foreground text-lg">
        نحن هنا من أجلك تواصل معنا لأي أسئلة أو مخاوف.
      </p>

      <div className="flex justify-center pt-2">
        <a
          href={CONTACT_INFO.WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors group"
        >
          <MessageCircle className="size-5 text-[#25D366] group-hover:scale-110 transition-transform" />
          <span className="font-medium text-foreground">
            تواصل عبر واتساب: {CONTACT_INFO.WHATSAPP}
          </span>
        </a>
      </div>
    </div>
  );
};

export default ContactHeader;
