import com.neva.gradle.fork.ForkExtension

configure<ForkExtension> {
    properties {
        define(mapOf(
                "adUsername" to { defaultValue = System.getProperty("user.name") },
                "adPassword" to { password() },
                "projectName" to {
                    description = "Artifact 'name' coordinate (lowercase)"
                    validator { lowercased(); alphanumeric() }
                },
                "projectLabel" to { description = "Nice project name (human-readable)" },
                "projectGroup" to {
                    description = "Java package in source code and artifact 'group' coordinate"
                    validator { javaPackage(); notContains("projectName") }
                },
                "aemInstanceType" to {
                    select("local", "remote")
                    description = "local - instance will be created on local file system.\nremote - connecting to remote instance only."
                },
                "aemInstanceRunModes" to { text("nosamplecontent") },
                "aemInstanceJvmOpts" to { text("-server -Xmx1024m -XX:MaxPermSize=256M -Djava.awt.headless=true") },
                "aemInstanceAuthorHttpUrl" to {
                    url("http://localhost:4502")
                    description = "URL for accessing AEM author instance"
                },
                "aemInstancePublishHttpUrl" to {
                    url("http://localhost:4503")
                    description = "URL for accessing AEM publish instance"
                }
        ))
    }
    config {
        cloneFiles()
        moveFiles(mapOf(
                "/com/company/aem/dialogeditor" to "/{{projectGroup|substitute('.', '/')}}/aem/{{projectName}}",
                "/dialogeditor" to "/{{projectName}}"
        ))
        replaceContents(mapOf(
                "com.ahmedmusallam.aem.dialogeditor" to "{{projectGroup}}.aem.{{projectName}}",
                "com.ahmedmusallam.aem" to "{{projectGroup}}.aem",
                "AEM Dialog Editor" to "{{projectLabel}}",
                "dialogeditor" to "{{projectName}}"
        ))
    }
}
