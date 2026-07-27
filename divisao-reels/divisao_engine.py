# -*- coding: utf-8 -*-
"""
DIVISAO ENGINE — sistema visual editorial @eusouramses (Ramses Castoldi)
Renderiza POST (4:5), CARROSSEL (4:5, capa/ato/cta) e REELS (9:16).
Off-white editorial + tinta + 1 palavra em OURO. Saida PNG 2x retina.

USO RAPIDO:
    from divisao_engine import render, FORMATS
    render({**FORMATS["post"], "kicker":"...", "headline":[...], ...}, "saida.png")

Marque a palavra de destaque com [[colchetes duplos]] -> sai em OURO.
Foto: passe "photo":"/caminho/foto.jpg". Sem foto -> placeholder cinematografico.
"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageFilter

BASE  = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(BASE, "fonts")
ASSETS= os.path.join(BASE, "assets")

# ---------------- PALETA (fixa) ----------------
PAPER=(244,239,228); PAPER_D=(236,230,216); INK=(24,22,18); INK_SOFT=(74,69,60)
GOLD=(176,133,46); RED=(176,50,43); MUTED=(132,124,108); LINE=(208,200,184); WHITE=(250,248,242)

def F(n,s): return ImageFont.truetype(os.path.join(FONTS,n),s)

# ---------------- helpers ----------------
def cover(img,w,h):
    ir=img.width/img.height; tr=w/h
    if ir>tr: nh=h; nw=int(h*ir)
    else: nw=w; nh=int(w/ir)
    img=img.resize((nw,nh),Image.LANCZOS); x=(nw-w)//2; y=(nh-h)//2
    return img.crop((x,y,x+w,y+h))

def paper_bg(w,h):
    base=Image.new("RGB",(w,h),PAPER); noise=Image.effect_noise((w,h),16).convert("L")
    tint=Image.new("RGB",(w,h),PAPER_D)
    return Image.composite(tint,base,noise.point(lambda p:max(0,p-150)))

def make_placeholder(w,h,label="SUA FOTO  ·  OU IMAGEM REALISTA GERADA"):
    img=Image.new("RGB",(w,h),(20,18,15)); d=ImageDraw.Draw(img)
    for i in range(h):
        t=i/h; d.line([(0,i),(w,i)],fill=(int(46-26*t),int(42-24*t),int(36-22*t)))
    vg=Image.new("L",(w,h),0); ImageDraw.Draw(vg).ellipse(
        [-int(w*0.25),-int(h*0.25),int(w*1.25),int(h*1.25)],fill=255)
    vg=vg.filter(ImageFilter.GaussianBlur(180))
    img=Image.composite(img,Image.new("RGB",(w,h),(8,7,6)),vg)
    wm=F("Gloock-Regular.ttf",int(h*0.5)); layer=Image.new("RGBA",(w,h),(0,0,0,0)); ld=ImageDraw.Draw(layer)
    tw=ld.textlength("RC",font=wm); ld.text(((w-tw)/2,h*0.10),"RC",font=wm,fill=(255,255,255,16))
    img=Image.alpha_composite(img.convert("RGBA"),layer).convert("RGB"); d=ImageDraw.Draw(img)
    lf=F("IBMPlexMono-Regular.ttf",34); tot=sum(d.textlength(c,font=lf)+8 for c in label)-8
    cx=w/2-tot/2; y=h/2-20
    for c in label: d.text((cx,y),c,font=lf,fill=(150,142,126)); cx+=d.textlength(c,font=lf)+8
    return img

def treat_photo(ph,w,h):
    ph=cover(ph.convert("RGB"),w,h)
    return ImageOps.autocontrast(ph,cutoff=1)

def ls_text(draw,xy,text,font,fill,tracking=0,anchor_left=True):
    x,y=xy
    if not anchor_left:
        tot=sum(draw.textlength(c,font=font)+tracking for c in text)-tracking; x=x-tot
    for c in text: draw.text((x,y),c,font=font,fill=fill); x+=draw.textlength(c,font=font)+tracking
    return x

def parse(line):
    segs=[]; buf=""; acc=False; i=0
    while i<len(line):
        if line[i:i+2]=="[[":
            if buf:segs.append((buf,False));buf=""
            acc=True;i+=2;continue
        if line[i:i+2]=="]]":
            if buf:segs.append((buf,True));buf=""
            acc=False;i+=2;continue
        buf+=line[i];i+=1
    if buf:segs.append((buf,acc))
    return segs

def clean(s): return s.replace("[[","").replace("]]","")

def draw_lines(draw,x,y,lines,font,leading,accent=GOLD,ink=INK):
    for line in lines:
        cx=x
        for txt,a in parse(line):
            draw.text((cx,y),txt,font=font,fill=(accent if a else ink)); cx+=draw.textlength(txt,font=font)
        y+=leading
    return y

def fit(draw,lines,ff,max_w,max_h,start,leadf,mins=44):
    s=start
    while s>mins:
        f=F(ff,s); lead=int(s*leadf); ok=all(draw.textlength(clean(l),font=f)<=max_w for l in lines)
        if ok and len(lines)*lead<=max_h: return f,s,lead
        s-=4
    return F(ff,mins),mins,int(mins*leadf)

# ---------------- formatos ----------------
FORMATS={
 "post":     dict(W=2160,H=2700,photo_ratio=0.54,mode="split",headline_size=205,leading=1.05),
 "capa":     dict(W=2160,H=2700,photo_ratio=0.54,mode="split",headline_size=205,leading=1.05),
 "ato":      dict(W=2160,H=2700,mode="text",headline_size=185,leading=1.07),
 "cta":      dict(W=2160,H=2700,mode="cta",headline_size=155,leading=1.06),
 "reels":    dict(W=2160,H=3840,photo_ratio=0.60,mode="split",headline_size=210,leading=1.05),
}
DEFAULTS=dict(margin=170,kicker_size=46,kicker_track=6,kicker_gap=75,headline_gap=54,
              headline_font="Lora-Bold.ttf",subline_size=62,sig_gap=215,sig_mono_size=96,
              index="ESTRATEGIA / Nº —",photo_tag="RAMSES CASTOLDI",accent="gold")

# ---------------- render ----------------
def render(spec,outname):
    s={**DEFAULTS,**spec}
    W,H,M=s["W"],s["H"],s["margin"]; mode=s["mode"]; accent=GOLD if s.get("accent","gold")=="gold" else RED
    photo_h=int(H*s.get("photo_ratio",0.54))
    card=paper_bg(W,H); draw=ImageDraw.Draw(card)

    if mode=="split":
        if s.get("photo") and os.path.exists(s["photo"]): ph=treat_photo(Image.open(s["photo"]),W,photo_h)
        else: ph=make_placeholder(W,photo_h)
        card.paste(ph,(0,0)); draw=ImageDraw.Draw(card)
        scrim=Image.new("L",(W,photo_h),0); sd=ImageDraw.Draw(scrim)
        for i in range(photo_h):
            t=i/photo_h; sd.line([(0,i),(W,i)],fill=int(max(0,(t-0.58)/0.42)*160))
        card.paste(Image.new("RGB",(W,photo_h),INK),(0,0),scrim); draw=ImageDraw.Draw(card)
        ls_text(draw,(M,int(M*0.78)),s["photo_tag"].upper(),F("IBMPlexMono-Bold.ttf",s["kicker_size"]-6),WHITE,tracking=6)
        draw.rectangle([0,photo_h-6,W,photo_h],fill=GOLD); panel_top=photo_h
    else:
        panel_top=M+10

    draw.rectangle([30,30,W-30,H-30],outline=LINE,width=2)

    bs=s["kicker_size"]; kf=F("IBMPlexMono-Bold.ttf",bs); ky=panel_top+s["kicker_gap"]
    draw.rectangle([M,ky+8,M+bs-14,ky+bs-6],fill=accent)
    ls_text(draw,(M+bs+20,ky),s["kicker"].upper(),kf,INK,tracking=s["kicker_track"])

    sy=H-s["sig_gap"]; rule_y=sy-34
    top=ky+bs+s["headline_gap"]
    sub_res=int(s["subline_size"]*1.55)+34 if s.get("subline") else 0
    cta_res=int(s.get("cta_size",58)*1.5)*len(s.get("cta_lines",[]))+40 if mode=="cta" else 0
    bottom=rule_y-50-sub_res-cta_res
    hf,hs,lead=fit(draw,s["headline"],s["headline_font"],W-2*M,bottom-top,s["headline_size"],s["leading"])
    end_y=draw_lines(draw,M,top,s["headline"],hf,lead,accent=accent)

    if s.get("subline"):
        draw.text((M,end_y+18),s["subline"],font=F("CrimsonPro-Italic.ttf",s["subline_size"]),fill=INK_SOFT)
    if mode=="cta" and s.get("cta_lines"):
        cf=F("Lora-Regular.ttf",s.get("cta_size",58)); cyy=end_y+30
        for ln in s["cta_lines"]:
            cx=M
            for txt,a in parse(ln):
                draw.text((cx,cyy),txt,font=cf,fill=(accent if a else INK_SOFT)); cx+=draw.textlength(txt,font=cf)
            cyy+=int(s.get("cta_size",58)*1.5)

    draw.line([(M,rule_y),(W-M,rule_y)],fill=GOLD,width=3)
    draw.text((M,sy-12),"RC",font=F("Gloock-Regular.ttf",s["sig_mono_size"]),fill=GOLD)
    mgw=draw.textlength("RC",font=F("Gloock-Regular.ttf",s["sig_mono_size"]))
    draw.text((M+mgw+36,sy+4),"RAMSES CASTOLDI",font=F("IBMPlexMono-Bold.ttf",40),fill=INK)
    draw.text((M+mgw+36,sy+56),"@eusouramses",font=F("IBMPlexMono-Regular.ttf",34),fill=MUTED)
    ls_text(draw,(W-M,sy+4),s["index"],F("IBMPlexMono-Regular.ttf",34),MUTED,tracking=2,anchor_left=False)
    if s.get("page"):
        ls_text(draw,(W-M,sy+56),s["page"],F("IBMPlexMono-Bold.ttf",34),GOLD,tracking=2,anchor_left=False)

    card.save(outname,"PNG"); print("OK ->",os.path.basename(outname),f"[hl {hs}px]")
    return outname

def render_format(fmt,content,outname):
    """fmt: post|capa|ato|cta|reels ; content: dict com kicker, headline, etc."""
    return render({**FORMATS[fmt],**content},outname)
