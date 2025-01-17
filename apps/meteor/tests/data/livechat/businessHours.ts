import { ILivechatBusinessHour } from "@rocket.chat/core-typings";
import { api, credentials, methodCall, request } from "../api-data";
import { updateEESetting, updateSetting } from "../permissions.helper"
import moment from "moment";
type ISaveBhApiWorkHour = Omit<ILivechatBusinessHour, '_id' | 'ts' | 'timezone'> & { workHours: { day: string, start: string, finish: string, open: boolean }[] } & { departmentsToApplyBusinessHour?: string } & { timezoneName: string };

export const makeDefaultBusinessHourActiveAndClosed = async () => {
	// enable settings
	await updateSetting('Livechat_enable_business_hours', true);
	await updateEESetting('Livechat_business_hour_type', 'Single');

	// create business hours
	const { body: { businessHour } } = await request
		.get(api('livechat/business-hour?type=default'))
		.set(credentials)
		.send();

	const workHours = businessHour.workHours as { start: string; finish: string; day: string, open: boolean }[];
	const allEnabledWorkHours = workHours.map((workHour) => {
		workHour.open = true;
		workHour.start = '00:00';
		workHour.finish = '00:01'; // if a job runs between 00:00 and 00:01, then this test will fail :P
		return workHour;
	});

	const enabledBusinessHour = {
		...businessHour,
		workHours: allEnabledWorkHours,
	}

	await request.post(methodCall('livechat:saveBusinessHour'))
		.set(credentials)
		.send({
			message: JSON.stringify({
				method: 'livechat:saveBusinessHour',
				params: [enabledBusinessHour],
				id: 'id',
				msg: 'method',
			}),
		});
}

export const disableDefaultBusinessHour = async () => {
	// disable settings
	await updateSetting('Livechat_enable_business_hours', false);
	await updateEESetting('Livechat_business_hour_type', 'Single');

	// create business hours
	const { body: { businessHour } } = await request
		.get(api('livechat/business-hour?type=default'))
		.set(credentials)
		.send();

	const workHours = businessHour.workHours as { start: string; finish: string; day: string, open: boolean }[];
	const allDisabledWorkHours = workHours.map((workHour) => {
		workHour.open = false;
		workHour.start = '00:00';
		workHour.finish = '23:59';
		return workHour;
	});

	const disabledBusinessHour = {
		...businessHour,
		workHours: allDisabledWorkHours,
	}

	await request.post(methodCall('livechat:saveBusinessHour'))
		.set(credentials)
		.send({
			message: JSON.stringify({
				method: 'livechat:saveBusinessHour',
				params: [disabledBusinessHour],
				id: 'id',
				msg: 'method',
			}),
		});
}

export const getWorkHours = (open = true): ISaveBhApiWorkHour['workHours'] => {
    const workHours: ISaveBhApiWorkHour['workHours'] = [];

    for (let i = 0; i < 7; i++) {
        workHours.push({
            day: moment().day(i).format('dddd'),
            start: '00:00',
            finish: '23:59',
            open,
        });
    }

    return workHours;
}
