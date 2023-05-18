import {
	Clarinet,
	Tx,
	Chain,
	Account,
	types,
} from 'https://deno.land/x/clarinet@v1.5.4/index.ts'
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts'
import { uintValue } from './utils/clarity.util.ts'

Clarinet.test({
	name: 'droplinked:create',
	fn(chain: Chain, accounts: Map<string, Account>) {
		const deployer = accounts.get('deployer')!
		const creator = accounts.get('wallet_1')!

		const droplinkedContract = deployer.address + '.droplinked-contract'
		const commission = 50
		const block = chain.mineBlock([
			Tx.contractCall(
				droplinkedContract,
				'create',
				[
					types.uint(10000),
					types.uint(25),
					types.uint(commission),
					types.ascii('ipfs://'),
					types.principal(creator.address),
				],
				creator.address
			),
		])

		Clarinet.test({
			name: 'should return ok response with sku id',
			fn: () => {
				assertEquals(block.receipts[0].result, types.ok(types.uint(1)))
			},
		})

		const createdSkuIdResult = block.receipts[0].result.expectOk()
		const createdSkuId = uintValue(createdSkuIdResult)

		Clarinet.test({
			name: 'should update commissions map',
			fn: () => {
				const commissionResult = chain.callReadOnlyFn(
					droplinkedContract,
					'get-commission',
					[types.uint(createdSkuId), types.principal(creator.address)],
					creator.address
				).result

				assertEquals(
					commissionResult,
					types.ok(types.some(types.uint(commission)))
				)
			},
		})

		Clarinet.test({
			name: 'should update creators map',
			fn: () => {
				const creatorsResult = chain.callReadOnlyFn(
					droplinkedContract,
					'get-creator',
					[types.uint(createdSkuId)],
					creator.address
				)

				assertEquals(
					creatorsResult.result,
					types.ok(types.some(types.principal(creator.address)))
				)
			},
		})
	},
})
