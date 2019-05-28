import org.gradle.api.tasks.testing.logging.TestExceptionFormat
import org.gradle.api.tasks.testing.logging.TestLogEvent

plugins {
    id("com.cognifide.aem.bundle")
    id("com.cognifide.aem.instance")
    id("com.neva.fork")
}

description = "AEM Dialog Editor"
defaultTasks(":aemSatisfy", ":aemDeploy")

group = "com.ahmedmusallam.aem"
version = "1.0.0-SNAPSHOT"

repositories {
    jcenter()
    maven { url = uri("https://repo.adobe.com/nexus/content/groups/public") }
    maven { url = uri("https://dl.bintray.com/neva-dev/maven-public") }
}

dependencies {
    compileOnly("org.osgi:osgi.cmpn:6.0.0")
    compileOnly("javax.servlet:servlet-api:2.5")
    compileOnly("javax.jcr:jcr:2.0")
    compileOnly("org.slf4j:slf4j-api:1.7.21")
    compileOnly("org.apache.geronimo.specs:geronimo-atinject_1.0_spec:1.0")
    compileOnly("org.apache.sling:org.apache.sling.api:2.16.4")
    compileOnly("org.apache.sling:org.apache.sling.jcr.api:2.4.0")
    compileOnly("org.apache.sling:org.apache.sling.models.api:1.3.6")
    compileOnly("com.google.code.gson:gson:2.8.1")
    compileOnly("joda-time:joda-time:2.9.1")
    compileOnly("javax.annotation:javax.annotation-api:1.3.2")

    compileOnly("com.adobe.aem:uber-jar:6.4.0:obfuscated-apis")
}

tasks {
    withType<Test>().configureEach {
        failFast = true
        useJUnitPlatform()
        testLogging {
            events = setOf(TestLogEvent.FAILED)
            exceptionFormat = TestExceptionFormat.SHORT
        }

        dependencies {
            "testImplementation"("org.junit.jupiter:junit-jupiter-api:5.3.2")
            "testRuntimeOnly"("org.junit.jupiter:junit-jupiter-engine:5.3.2")
            "testImplementation"("io.wcm:io.wcm.testing.aem-mock.junit5:2.3.2")
        }
    }
}

apply(from = "gradle/fork.gradle.kts")
