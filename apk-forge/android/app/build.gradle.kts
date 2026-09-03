plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val forgeWebOrigin = providers.gradleProperty("FORGE_WEB_ORIGIN")
    .orElse("https://forge.invalid")
    .get()

android {
    namespace = "in.promptstudio.ai"
    compileSdk = 35

    defaultConfig {
        applicationId = "in.promptstudio.ai"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
        buildConfigField("String", "FORGE_WEB_ORIGIN", "\"$forgeWebOrigin\"")
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        buildConfig = true
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-ktx:1.10.0")
    implementation("androidx.webkit:webkit:1.12.1")
}
