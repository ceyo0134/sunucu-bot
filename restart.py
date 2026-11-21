import os, sys, time
from python_aternos import Client

user = os.environ["ATERNOS_USER"]
pw = os.environ["ATERNOS_PASS"]
name = os.environ.get("ATERNOS_SERVER", "").strip()

at = Client.from_credentials(user, pw)
servers = at.list_servers()
if not servers:
    sys.exit("Hesapta sunucu bulunamadi")
srv = next((s for s in servers if name and s.subdomain == name), servers[0])
print("Sunucu:", srv.address)

def wait(states, timeout):
    t = time.time()
    while time.time() - t < timeout:
        srv.fetch()
        if srv.status in states:
            return True
        time.sleep(10)
    return False

srv.fetch()
print("Durum:", srv.status)
if srv.status in ("online", "starting", "loading", "preparing"):
    srv.stop()
    print("Kapatiliyor...")
    if not wait(("offline",), 300):
        sys.exit("Kapanmadi")
time.sleep(15)
srv.start()
print("Aciliyor...")
if not wait(("online", "starting", "loading", "preparing", "queueing"), 300):
    sys.exit("Acilmadi")
print("Tamam:", srv.status)
