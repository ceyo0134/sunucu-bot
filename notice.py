t = open("out.log", encoding="utf8", errors="replace").read()[-3500:]
t = t.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
print("::notice title=botlog::" + t)
