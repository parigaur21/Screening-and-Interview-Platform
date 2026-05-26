import jenkins.model.*
import hudson.security.*
import jenkins.install.InstallState
import jenkins.model.JenkinsLocationConfiguration

def instance = Jenkins.get()

if (instance.getInstallState() != InstallState.INITIAL_SETUP_COMPLETED) {
    instance.setInstallState(InstallState.INITIAL_SETUP_COMPLETED)
}

def currentRealm = instance.getSecurityRealm()
if (!(currentRealm instanceof HudsonPrivateSecurityRealm)) {
    currentRealm = new HudsonPrivateSecurityRealm(false)
    instance.setSecurityRealm(currentRealm)
}

def admin = currentRealm.getUser('admin')
if (admin == null) {
    currentRealm.createAccount('admin', 'DevOps2026!')
    println('Created admin user admin')
}

def strategy = new FullControlOnceLoggedInAuthorizationStrategy()
instance.setAuthorizationStrategy(strategy)
instance.save()

def location = JenkinsLocationConfiguration.get()
location.setUrl('http://localhost:8082')
location.save()
