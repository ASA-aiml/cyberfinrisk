{{- define "cyberfinrisk.fullname" -}}
{{- printf "%s-%s" .Release.Name "cyberfinrisk" | trunc 63 | trimSuffix "-" -}}
{{- end -}}
