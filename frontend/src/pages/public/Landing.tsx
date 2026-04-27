import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PageWrapper } from '../../components/ui/PageWrapper';
import { Button } from '../../components/ui/Button';
import type { CSSProperties } from 'react';
import { useRef } from 'react';



/* ── QR Scanner — Holographic 3D Visual ── */
const QRVisual = () => (
  <div style={{position:'relative',width:'100%',maxWidth:'380px',aspectRatio:'1',margin:'0 auto',perspective:'800px'}}>
    
    {/* Pulsing concentric rings */}
    {[0,0.8,1.6].map((delay,i)=>(
      <motion.div key={i}
        animate={{scale:[0.85,1.1,0.85],opacity:[0.15,0.4,0.15]}}
        transition={{duration:3,delay,repeat:Infinity,ease:'easeInOut'}}
        style={{position:'absolute',inset:`${-10-i*15}px`,borderRadius:'28px',
          border:'2px solid color-mix(in srgb, var(--primary) 25%, transparent)',pointerEvents:'none'}} />
    ))}

    {/* Main card — slight 3D tilt */}
    <motion.div
      animate={{rotateY:[-3,3,-3],rotateX:[2,-2,2]}}
      transition={{duration:8,repeat:Infinity,ease:'easeInOut'}}
      style={{position:'relative',width:'100%',height:'100%',borderRadius:'24px',
        background:'var(--bg-card)',
        backdropFilter:'blur(24px)',
        border:'2px solid color-mix(in srgb, var(--primary) 25%, transparent)',padding:'32px',
        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
        boxShadow:'0 25px 80px -20px var(--shadow-glass), 0 0 80px -10px color-mix(in srgb, var(--primary) 15%, transparent), inset 0 1px 0 var(--border-light)',
        overflow:'hidden',transformStyle:'preserve-3d'}}
    >
      {/* Holographic shimmer overlay */}
      <motion.div
        animate={{x:['-100%','200%']}}
        transition={{duration:4,repeat:Infinity,ease:'easeInOut',repeatDelay:2}}
        style={{position:'absolute',inset:0,
          background:'linear-gradient(105deg, transparent 25%, color-mix(in srgb, var(--primary) 8%, transparent) 42%, color-mix(in srgb, var(--secondary) 6%, transparent) 50%, color-mix(in srgb, var(--primary) 8%, transparent) 58%, transparent 75%)',
          zIndex:1,pointerEvents:'none'}} />

      {/* Scanner frame */}
      <div style={{position:'relative',width:'72%',aspectRatio:'1',zIndex:2}}>
        {/* Animated corner brackets */}
        {[
          {t:0,l:0,bT:'3px solid var(--primary)',bL:'3px solid var(--primary)'},
          {t:0,r:0,bT:'3px solid var(--primary)',bR:'3px solid var(--primary)'},
          {b:0,l:0,bB:'3px solid var(--primary)',bL:'3px solid var(--primary)'},
          {b:0,r:0,bB:'3px solid var(--primary)',bR:'3px solid var(--primary)'}
        ].map((c,i)=>(
          <motion.div key={i}
            animate={{scale:[1,1.08,1],opacity:[0.7,1,0.7]}}
            transition={{duration:2,delay:i*0.15,repeat:Infinity,ease:'easeInOut'}}
            style={{position:'absolute',width:'30px',height:'30px',borderRadius:'4px',
              top:c.t,left:c.l,right:c.r,bottom:c.b,
              borderTop:c.bT,borderLeft:c.bL,borderRight:c.bR,borderBottom:c.bB,
              filter:'drop-shadow(0 0 6px color-mix(in srgb, var(--primary) 40%, transparent))'} as CSSProperties} />
        ))}

        {/* Horizontal scan line */}
        <motion.div
          animate={{top:['5%','90%','5%']}}
          transition={{duration:2.8,repeat:Infinity,ease:'easeInOut'}}
          style={{position:'absolute',left:'6%',right:'6%',height:'2px',
            background:'linear-gradient(90deg, transparent 0%, var(--primary) 20%, var(--primary) 80%, transparent 100%)',
            boxShadow:'0 0 24px 8px color-mix(in srgb, var(--primary) 50%, transparent), 0 0 80px 15px color-mix(in srgb, var(--primary) 20%, transparent)',
            zIndex:3}}
        >
          {/* Trailing glow beneath scan line */}
          <div style={{position:'absolute',top:'2px',left:0,right:0,height:'30px',
            background:'linear-gradient(180deg, color-mix(in srgb, var(--primary) 20%, transparent), transparent)',
            pointerEvents:'none'}} />
        </motion.div>

        {/* QR dot matrix */}
        <div style={{position:'absolute',inset:'22px',display:'grid',gridTemplateColumns:'repeat(8,1fr)',gridTemplateRows:'repeat(8,1fr)',gap:'3px'}}>
          {Array.from({length:64},(_,i)=>{
            const row=Math.floor(i/8), col=i%8;
            const isCorner=(row<3&&col<3)||(row<3&&col>4)||(row>4&&col<3);
            const isCyan=isCorner||Math.random()>0.55;
            return (
              <motion.div key={i}
                initial={{opacity:0,scale:0}}
                animate={{opacity:isCyan?[0.5,1,0.5]:[0.1,0.3,0.1],scale:1}}
                transition={{duration:isCyan?2:3,delay:i*0.03,repeat:Infinity,repeatType:'reverse'}}
                style={{borderRadius:isCorner?'3px':'2px',
                  background:isCyan?'var(--primary)':'color-mix(in srgb, var(--primary) 15%, transparent)',
                  boxShadow:isCorner?'0 0 8px color-mix(in srgb, var(--primary) 45%, transparent)':'none'}} />
            );
          })}
        </div>
      </div>

      {/* Status indicators */}
      <div style={{marginTop:'24px',display:'flex',alignItems:'center',gap:'12px',zIndex:2}}>
        <motion.div
          animate={{opacity:[0.4,1,0.4]}}
          transition={{duration:1.5,repeat:Infinity}}
          style={{width:'6px',height:'6px',borderRadius:'50%',background:'var(--success)',boxShadow:'0 0 8px color-mix(in srgb, var(--success) 50%, transparent)'}} />
        <div style={{fontSize:'11px',color:'var(--text-muted)',letterSpacing:'2.5px',textTransform:'uppercase',fontWeight:600}}>
          Scanning Active
        </div>
      </div>
    </motion.div>
  </div>
);

/* ── Data ── */
const features = [
  {icon:'🛡️',title:'Secure Health Identity',desc:'Enterprise-grade protected medical identity via a unique BIONEX UUID and auto-generated QR code.'},
  {icon:'👨‍⚕️',title:'Doctor Verification',desc:'Only verified, licensed professionals can interact with your timeline and add records securely.'},
  {icon:'🏥',title:'Medical Timeline',desc:'Your complete chronological medical history, organized beautifully and accessible instantly.'},
  {icon:'🚨',title:'Emergency Access',desc:'Time-limited QR codes give first responders critical, life-saving information without login.'},
  {icon:'👨‍👩‍👧‍👦',title:'Family Profiles',desc:'Manage health records for your entire family seamlessly under one master account.'},
  {icon:'📊',title:'Audit Logging',desc:'Complete transparency. Know exactly who accessed your data, when, and from where.'},
];

const steps = [
  {
    n:'01',title:'Generate Identity',desc:'Sign up to auto-generate your secure UUID and personal QR code.',icon:'🪪',
    bullets: ['Instant verification', 'Unique BIONEX UUID', 'Cryptographic security']
  },
  {
    n:'02',title:'Link Dependents',desc:'Add family members and manage their identities from one place.',icon:'👨‍👩‍👧‍👦',
    bullets: ['Unified dashboard', 'Shared emergency contacts', 'Role-based access']
  },
  {
    n:'03',title:'Present to Doctor',desc:'Show your QR code at any verified hospital. No more paper files.',icon:'📱',
    bullets: ['Scan & go access', 'No physical paperwork', 'Temporary secure tokens']
  },
  {
    n:'04',title:'Live Timeline',desc:'Doctors securely upload records directly to your immutable timeline.',icon:'⚡',
    bullets: ['Chronological history', 'Immutable audit logs', 'Instant notifications']
  },
];

const stats = [
  {value:'256-bit',label:'AES Encryption'},
  {value:'99.9%',label:'Uptime SLA'},
  {value:'<200ms',label:'Access Latency'},
  {value:'HIPAA',label:'Compliant'},
];

const orb: CSSProperties = {position:'absolute',borderRadius:'50%',filter:'blur(120px)',opacity:0.1,pointerEvents:'none',zIndex:0};

/* ── Fade-in wrapper ── */
const FadeIn = ({children,delay=0,y=30,style}:{children:React.ReactNode;delay?:number;y?:number;style?:CSSProperties}) => (
  <motion.div initial={{opacity:0,y}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:'-60px'}} transition={{duration:0.6,delay,ease:[0.22,1,0.36,1]}} style={style}>
    {children}
  </motion.div>
);

/* ════════════════════════ COMPONENT ════════════════════════ */
export const Landing = () => {
  const roadmapRef = useRef(null);
  const {scrollYProgress} = useScroll({target:roadmapRef,offset:['start end','end start']});
  const lineW = useTransform(scrollYProgress,[0.15,0.85],['0%','100%']);

  return (
    <PageWrapper noPadding>      {/* ═══════════ HERO ═══════════ */}
      <section style={{position:'relative',overflow:'hidden',minHeight:'100vh',display:'flex',alignItems:'center',padding:'100px 24px 60px'}}>
        {/* Grid bg */}
        <motion.div style={{position:'absolute',inset:'-50%',backgroundImage:'radial-gradient(color-mix(in srgb, var(--primary) 10%, transparent) 1px,transparent 1px)',backgroundSize:'50px 50px',maskImage:'radial-gradient(circle at center,black 0%,transparent 50%)',WebkitMaskImage:'radial-gradient(circle at center,black 0%,transparent 50%)',zIndex:-1}}
          animate={{rotate:360}} transition={{duration:240,repeat:Infinity,ease:'linear'}} />
        <motion.div animate={{scale:[1,1.25,1],opacity:[0.08,0.16,0.08]}} transition={{duration:14,repeat:Infinity,ease:'easeInOut'}}
          style={{...orb,width:'800px',height:'800px',background:'var(--primary)',top:'-10%',right:'-5%'}} />
        <motion.div animate={{scale:[1,1.1,1],opacity:[0.06,0.12,0.06]}} transition={{duration:16,repeat:Infinity,ease:'easeInOut',delay:3}}
          style={{...orb,width:'600px',height:'600px',background:'var(--accent)',bottom:'-5%',left:'-5%'}} />

        <div className="hero-grid" style={{maxWidth:'1200px',width:'100%',margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'60px',alignItems:'center',position:'relative',zIndex:2}}>
          {/* LEFT — Text */}
          <motion.div initial={{opacity:0,x:-40}} animate={{opacity:1,x:0}} transition={{duration:0.8,ease:[0.22,1,0.36,1]}}>
            <motion.div style={{display:'inline-flex',padding:'7px 18px',background:'color-mix(in srgb, var(--primary) 6%, transparent)',border:'1px solid color-mix(in srgb, var(--primary) 15%, transparent)',color:'var(--primary)',borderRadius:'100px',fontSize:'11px',fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:'28px'}}
              animate={{boxShadow:['0 0 0 0 transparent','0 0 0 8px color-mix(in srgb, var(--primary) 5%, transparent)','0 0 0 0 transparent']}} transition={{duration:3,repeat:Infinity}}>
              ✦ Bionex Digital Identity
            </motion.div>
            <h1 style={{fontSize:'clamp(36px,4.5vw,64px)',fontWeight:800,lineHeight:1.08,marginBottom:'24px',letterSpacing:'-2px'}}>
              Your Health.<br/><span className="text-gradient">One Identity.</span><br/>Everywhere.
            </h1>
            <p style={{fontSize:'clamp(15px,1.5vw,18px)',color:'var(--text-muted)',maxWidth:'480px',marginBottom:'36px',lineHeight:1.75}}>
              A modern, role-based health identity platform giving you absolute control over your medical records, family accounts, and emergency protocols.
            </p>
            <motion.div className="hero-buttons" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:0.4,duration:0.5}} style={{display:'flex',gap:'14px',flexWrap:'wrap'}}>
              <Link to="/register"><Button size="lg" style={{padding:'15px 32px',fontSize:'15px',borderRadius:'14px',fontWeight:700}}>Create Your Bionex ID</Button></Link>
              <a href="#features"><Button variant="secondary" size="lg" style={{padding:'15px 32px',fontSize:'15px',borderRadius:'14px',background:'color-mix(in srgb, var(--border-light) 50%, transparent)',border:'1px solid var(--border-light)'}}>Learn More ↓</Button></a>
            </motion.div>
          </motion.div>

          {/* RIGHT — QR Visual */}
          <motion.div className="scanner-visual" initial={{opacity:0,x:40,scale:0.95}} animate={{opacity:1,x:0,scale:1}} transition={{duration:0.9,ease:[0.22,1,0.36,1],delay:0.25}}>
            <QRVisual />
          </motion.div>
        </div>
      </section>




      {/* ═══════════ FEATURES ═══════════ */}
      <section id="features" style={{padding:'120px 24px',position:'relative'}}>
        <div style={{maxWidth:'1200px',margin:'0 auto'}}>
          <FadeIn style={{textAlign:'center',marginBottom:'64px'}}>
            <div style={{fontSize:'12px',fontWeight:700,color:'var(--primary)',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'16px'}}>Features</div>
            <h2 style={{fontSize:'clamp(28px,4vw,44px)',marginBottom:'16px'}}>Enterprise Grade Healthcare</h2>
            <p style={{color:'var(--text-muted)',fontSize:'16px',maxWidth:'500px',margin:'0 auto',lineHeight:1.7}}>Built for the future of digital health. Secure, scalable, and instantly accessible.</p>
          </FadeIn>

          <div className="features-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))',gap:'24px'}}>
            {features.map((f,i)=>(
                <motion.div key={f.title} initial={{opacity:0,y:35}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:'-40px'}} transition={{delay:0.07*i,duration:0.5}}
                  whileHover={{y:-5,borderColor:'color-mix(in srgb, var(--primary) 30%, transparent)',boxShadow:'0 16px 48px -12px color-mix(in srgb, var(--primary) 15%, transparent), inset 0 0 20px rgba(0,229,255,0.02)'}}
                  style={{
                    background:'var(--bg-card)',backdropFilter:'blur(16px)',border:'1px solid var(--border-light)',
                    borderRadius:'24px',padding:'36px',transition:'all 0.3s ease',position:'relative',overflow:'hidden',
                    display:'flex',flexDirection:'column',justifyContent:'flex-end'
                  }}>
                  {/* Subtle hover gradient inside */}
                  <motion.div initial={{opacity:0}} whileHover={{opacity:1}} transition={{duration:0.3}} style={{position:'absolute',inset:0,background:'radial-gradient(circle at top right, rgba(0,229,255,0.08) 0%, transparent 70%)',pointerEvents:'none'}} />
                  
                  <div style={{width:'56px',height:'56px',borderRadius:'16px',background:'rgba(0,229,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'26px',marginBottom:'auto',border:'1px solid color-mix(in srgb, var(--primary) 15%, transparent)',boxShadow:'0 8px 16px -4px color-mix(in srgb, var(--primary) 10%, transparent)'}}>{f.icon}</div>
                  <div style={{marginTop:'32px'}}>
                    <div style={{fontSize:'20px',fontWeight:700,color:'var(--text-heading)',marginBottom:'12px'}}>{f.title}</div>
                    <div style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.7}}>{f.desc}</div>
                  </div>
                </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS — Interactive Horizontal ═══════════ */}
      <section style={{padding:'120px 24px',position:'relative',overflow:'hidden'}}>
        {/* Section bg glow */}
        <div style={{...orb,width:'600px',height:'600px',background:'var(--primary)',top:'30%',left:'-10%',opacity:0.05}} />
        <div style={{...orb,width:'500px',height:'500px',background:'var(--accent)',bottom:'10%',right:'-10%',opacity:0.04}} />

        <div style={{maxWidth:'1200px',margin:'0 auto',position:'relative'}}>
          <FadeIn style={{textAlign:'center',marginBottom:'80px'}}>
            <div style={{fontSize:'12px',fontWeight:700,color:'var(--primary)',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'16px'}}>Process</div>
            <h2 style={{fontSize:'clamp(28px,4vw,44px)',marginBottom:'16px'}}>How Bionex Works</h2>
            <p style={{color:'var(--text-muted)',fontSize:'16px'}}>Hover over the steps to see your journey.</p>
          </FadeIn>

          {/* Interactive Horizontal Cards */}
          <div className="steps-row" style={{display:'flex',gap:'16px',height:'340px',position:'relative',zIndex:1}}>
            {steps.map((s,i)=>(
              <motion.div key={s.n}
                initial="initial"
                whileHover="hover"
                variants={{
                  initial: { flex: 1, background: 'var(--bg-card)' },
                  hover: { flex: 3, background: 'var(--bg-card)' }
                }}
                transition={{duration:0.4,ease:[0.22,1,0.36,1]}}
                style={{
                  borderRadius:'24px',border:'1px solid var(--border-light)',
                  position:'relative',overflow:'hidden',backdropFilter:'blur(16px)',
                  display:'flex',flexDirection:'column',justifyContent:'flex-end',
                  cursor:'default',
                }}
              >
                {/* Active glow on hover */}
                <motion.div 
                  variants={{ initial: { opacity: 0 }, hover: { opacity: 1 } }}
                  transition={{duration:0.4}}
                  style={{position:'absolute',inset:0,background:'radial-gradient(circle at center, color-mix(in srgb, var(--primary) 15%, transparent) 0%, transparent 60%)',pointerEvents:'none'}} 
                />
                
                {/* Step number bg */}
                <div style={{position:'absolute',top:'20px',right:'20px',fontSize:'64px',fontWeight:900,color:'color-mix(in srgb, var(--primary) 6%, transparent)',lineHeight:1,fontFamily:'var(--font-heading)'}}>{s.n}</div>

                <div style={{padding:'32px',position:'relative',zIndex:2}}>
                  <div style={{width:'48px',height:'48px',borderRadius:'14px',background:'color-mix(in srgb, var(--primary) 10%, transparent)',border:'1px solid rgba(0,229,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',marginBottom:'20px'}}>{s.icon}</div>
                  <div style={{color:'var(--primary)',fontWeight:700,fontSize:'11px',letterSpacing:'2px',marginBottom:'8px'}}>STEP {s.n}</div>
                  <h3 style={{fontSize:'20px',fontWeight:700,color:'var(--text-heading)',marginBottom:'12px',whiteSpace:'nowrap'}}>{s.title}</h3>
                  <motion.div 
                    variants={{ initial: { opacity: 0, height: 0, marginTop: 0 }, hover: { opacity: 1, height: 'auto', marginTop: '12px' } }}
                    transition={{duration:0.3}}
                    style={{overflow:'hidden'}}
                  >
                    <p style={{color:'var(--text-muted)',fontSize:'15px',lineHeight:1.6,margin:0,marginBottom:'16px'}}>
                      {s.desc}
                    </p>
                    <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                      {s.bullets.map((b, idx) => (
                        <div key={idx} style={{display:'flex',alignItems:'center',gap:'10px',color:'var(--text-heading)',fontSize:'14px',fontWeight:500}}>
                          <div style={{width:'6px',height:'6px',borderRadius:'50%',background:'var(--primary)',boxShadow:'0 0 8px var(--primary)'}} />
                          {b}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section style={{padding:'60px 24px 100px'}}>
        <motion.div className="cta-section" initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
          style={{background:'var(--bg-card)',border:'1px solid rgba(0,229,255,0.08)',borderRadius:'28px',padding:'80px 40px',maxWidth:'1000px',margin:'0 auto',position:'relative',overflow:'hidden',textAlign:'center'}}>
          <div style={{...orb,width:'500px',height:'500px',background:'var(--primary)',top:'50%',left:'50%',transform:'translate(-50%,-50%)',opacity:0.06}} />
          <motion.div animate={{rotate:360}} transition={{duration:40,repeat:Infinity,ease:'linear'}}
            style={{position:'absolute',top:'-80px',right:'-80px',width:'260px',height:'260px',borderRadius:'50%',border:'1px solid color-mix(in srgb, var(--primary) 5%, transparent)',pointerEvents:'none'}} />
          <h2 style={{fontSize:'clamp(26px,3.5vw,38px)',marginBottom:'16px',position:'relative',zIndex:10}}>Ready to secure your health identity?</h2>
          <p style={{color:'var(--text-muted)',fontSize:'16px',maxWidth:'500px',margin:'0 auto 32px',position:'relative',zIndex:10,lineHeight:1.7}}>
            Join the thousands who trust Bionex with their medical data. Your health, seamlessly connected.
          </p>
          <div style={{position:'relative',zIndex:10}}>
            <Link to="/register"><Button size="lg" style={{padding:'16px 40px',borderRadius:'14px',fontWeight:700}}>Create Free Account</Button></Link>
          </div>
        </motion.div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer style={{textAlign:'center',padding:'32px',borderTop:'1px solid var(--border-light)',color:'var(--text-muted)',fontSize:'13px',letterSpacing:'0.02em'}}>
        © 2026 Bionex Inc. Secure Health Identity Platform. All rights reserved.
      </footer>
    </PageWrapper>
  );
};
