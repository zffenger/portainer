export function KubernetesResourcePoolFormValues(defaults) {
  return {
    MemoryLimit: defaults.MemoryLimit,
    CpuLimit: defaults.CpuLimit,
    HasQuota: true,
    IngressClasses: [], // KubernetesResourcePoolIngressClassFormValue
  };
}

/**
 * @param {KubernetesIngressClass} ingressClass
 */
export function KubernetesResourcePoolIngressClassFormValue(ingressClass) {
  return {
    Namespace: undefined, // will be filled inside ResourcePoolService.create
    IngressClass: ingressClass,
    RewriteTarget: false,
    Annotations: [], // KubernetesResourcePoolIngressClassAnnotationFormValue
    Hosts: [],
    Selected: false,
    WasSelected: false,
    AdvancedConfig: false,
  };
}

export function KubernetesResourcePoolIngressClassAnnotationFormValue() {
  return {
    Key: '',
    Value: '',
  };
}

export function KubernetesResourcePoolIngressClassHostFormValue() {
  return {
    Host: '',
    PreviousHost: '',
    NeedsDeletion: false,
    IsNew: true,
  };
}
