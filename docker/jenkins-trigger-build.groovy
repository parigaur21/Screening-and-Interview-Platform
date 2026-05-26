import jenkins.model.*
import hudson.model.*

Jenkins instance = Jenkins.get()
def job = instance.getItemByFullName('DevOpsProject')
if (job != null && job instanceof Job) {
    if (!job.isBuilding()) {
        job.scheduleBuild2(0)
        println('Scheduled build for DevOpsProject')
    }
}

new File(instance.getRootDir(), 'init.groovy.d/jenkins-trigger-build.groovy').delete()
