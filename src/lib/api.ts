import * as k3s from '@kubernetes/client-node';
import fs from 'fs';

const kc = new k3s.KubeConfig();

if (process.env.KUBERNETES_SERVICE_HOST) {
	kc.loadFromCluster();
} else {
	if (fs.existsSync('/etc/k3s/k3s.yaml')) {
		kc.loadFromFile('/etc/k3s/k3s.yaml');
	} else {
		kc.loadFromFile('/etc/k3s/default.yaml');
	}
}

const k3sApi = kc.makeApiClient(k3s.CoreV1Api);
const appsApi = kc.makeApiClient(k3s.AppsV1Api);
const networkingApi = kc.makeApiClient(k3s.NetworkingV1Api);
const storageApi = kc.makeApiClient(k3s.StorageV1Api);
const customObjectsApi = kc.makeApiClient(k3s.CustomObjectsApi);
const coreV1Api = kc.makeApiClient(k3s.CoreV1Api);

export { k3sApi, appsApi, networkingApi, storageApi, customObjectsApi, coreV1Api };
