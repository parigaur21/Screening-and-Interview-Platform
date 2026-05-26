import jenkins.model.*
import hudson.security.*

def instance = Jenkins.get()

def currentRealm = instance.getSecurityRealm()
if (!(currentRealm instanceof HudsonPrivateSecurityRealm)) {
    currentRealm = new HudsonPrivateSecurityRealm(false)
    instance.setSecurityRealm(currentRealm)
}

def user = currentRealm.getUser('copilotadmin')
if (user == null) {
    currentRealm.createAccount('copilotadmin', 'admin12345')
    println('Created copilotadmin')
}
instance.save()
